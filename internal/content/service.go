package content

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"lms-go/internal/ent"
	entcontent "lms-go/internal/ent/content"
	entorg "lms-go/internal/ent/organization"
)

const (
	StatusPending   = "pending"
	StatusAvailable = "available"
	StatusArchived  = "archived"
)

type Storage interface {
	PresignUpload(ctx context.Context, object string, contentType string, expires time.Duration) (string, error)
	PresignDownload(ctx context.Context, object string, expires time.Duration) (string, error)
	Remove(ctx context.Context, object string) error
}

type Config struct {
	UploadExpiry   time.Duration
	DownloadExpiry time.Duration
}

type Service struct {
	client         *ent.Client
	storage        Storage
	uploadExpiry   time.Duration
	downloadExpiry time.Duration
}

func NewService(client *ent.Client, storage Storage, cfg Config) *Service {
	upload := cfg.UploadExpiry
	if upload == 0 {
		upload = 15 * time.Minute
	}
	download := cfg.DownloadExpiry
	if download == 0 {
		download = 15 * time.Minute
	}
	return &Service{
		client:         client,
		storage:        storage,
		uploadExpiry:   upload,
		downloadExpiry: download,
	}
}

type CreateUploadInput struct {
	OrganizationID uuid.UUID
	Name           string
	MimeType       string
	SizeBytes      int64
	Metadata       map[string]any
}

type UploadLink struct {
	Content   *ent.Content
	UploadURL string
	ExpiresAt time.Time
}

type FinalizeInput struct {
	Name      *string
	MimeType  *string
	SizeBytes *int64
	Metadata  map[string]any
}

func (s *Service) CreateUpload(ctx context.Context, input CreateUploadInput) (*UploadLink, error) {
	if input.OrganizationID == uuid.Nil {
		return nil, ErrInvalidInput
	}
	name := strings.TrimSpace(input.Name)
	if name == "" || input.MimeType == "" {
		return nil, ErrInvalidInput
	}
	if err := s.ensureOrg(ctx, input.OrganizationID); err != nil {
		return nil, err
	}

	objectKey := buildStorageKey(input.OrganizationID, name)
	metadata := input.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	content, err := s.client.Content.Create().
		SetOrganizationID(input.OrganizationID).
		SetName(name).
		SetMimeType(input.MimeType).
		SetSizeBytes(input.SizeBytes).
		SetStorageKey(objectKey).
		SetStatus(StatusPending).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(s.uploadExpiry)
	uploadURL, err := s.storage.PresignUpload(ctx, content.StorageKey, content.MimeType, s.uploadExpiry)
	if err != nil {
		return nil, fmt.Errorf("content: presign upload: %w", err)
	}

	return &UploadLink{
		Content:   content,
		UploadURL: uploadURL,
		ExpiresAt: expiresAt,
	}, nil
}

func (s *Service) Finalize(ctx context.Context, orgID, contentID uuid.UUID, input FinalizeInput) (*ent.Content, error) {
	update := s.client.Content.UpdateOneID(contentID).
		Where(entcontent.OrganizationIDEQ(orgID)).
		SetStatus(StatusAvailable).
		SetUpdatedAt(time.Now())

	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return nil, ErrInvalidInput
		}
		update.SetName(name)
	}
	if input.MimeType != nil {
		mime := strings.TrimSpace(*input.MimeType)
		if mime == "" {
			return nil, ErrInvalidInput
		}
		update.SetMimeType(mime)
	}
	if input.SizeBytes != nil {
		update.SetSizeBytes(*input.SizeBytes)
	}
	if input.Metadata != nil {
		update.SetMetadata(input.Metadata)
	}

	content, err := update.Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return content, nil
}

func (s *Service) Get(ctx context.Context, orgID, contentID uuid.UUID) (*ent.Content, error) {
	content, err := s.client.Content.Query().
		Where(entcontent.IDEQ(contentID), entcontent.OrganizationIDEQ(orgID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return content, nil
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]*ent.Content, error) {
	return s.client.Content.Query().
		Where(entcontent.OrganizationIDEQ(orgID), entcontent.StatusNEQ(StatusArchived)).
		Order(ent.Asc(entcontent.FieldCreatedAt)).
		All(ctx)
}

func (s *Service) Archive(ctx context.Context, orgID, contentID uuid.UUID) error {
	_, err := s.client.Content.UpdateOneID(contentID).
		Where(entcontent.OrganizationIDEQ(orgID)).
		SetStatus(StatusArchived).
		SetUpdatedAt(time.Now()).
		Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return ErrNotFound
		}
		return err
	}
	return nil
}

func (s *Service) PresignDownload(ctx context.Context, orgID, contentID uuid.UUID) (string, time.Time, error) {
	content, err := s.Get(ctx, orgID, contentID)
	if err != nil {
		return "", time.Time{}, err
	}
	if content.Status != StatusAvailable {
		return "", time.Time{}, fmt.Errorf("content: not available")
	}
	expires := time.Now().Add(s.downloadExpiry)
	url, err := s.storage.PresignDownload(ctx, content.StorageKey, s.downloadExpiry)
	if err != nil {
		return "", time.Time{}, err
	}
	return url, expires, nil
}

func (s *Service) ensureOrg(ctx context.Context, orgID uuid.UUID) error {
	exists, err := s.client.Organization.Query().
		Where(entorg.IDEQ(orgID)).
		Exist(ctx)
	if err != nil {
		return err
	}
	if !exists {
		return ErrInvalidInput
	}
	return nil
}

func buildStorageKey(orgID uuid.UUID, name string) string {
	safeName := strings.ToLower(name)
	safeName = strings.ReplaceAll(safeName, " ", "-")
	safeName = strings.ReplaceAll(safeName, "/", "-")
	now := time.Now().UTC()
	return filepath.Join(
		orgID.String(),
		fmt.Sprintf("%04d/%02d/%02d", now.Year(), now.Month(), now.Day()),
		uuid.NewString()+"-"+safeName,
	)
}
