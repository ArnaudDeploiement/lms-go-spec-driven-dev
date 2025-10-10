package user

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"lms-go/internal/auth"
	"lms-go/internal/ent"
	entorg "lms-go/internal/ent/organization"
	entuser "lms-go/internal/ent/user"
)

// Service gère la création et la gestion des utilisateurs par organisation.
type Service struct {
	client *ent.Client
}

func NewService(client *ent.Client) *Service {
	return &Service{client: client}
}

type CreateInput struct {
	OrganizationID uuid.UUID
	Email          string
	Password       string
	Role           string
	Status         string
	Metadata       map[string]any
}

type UpdateInput struct {
	Email    *string
	Password *string
	Role     *string
	Status   *string
	Metadata map[string]any
}

type Filter struct {
	Role   string
	Status string
}

func normalizeEmail(email string) string {
	return strings.TrimSpace(strings.ToLower(email))
}

func normalizeRole(role string) string {
	role = strings.TrimSpace(strings.ToLower(role))
	if role == "" {
		return "learner"
	}
	return role
}

func normalizeStatus(status string) string {
	status = strings.TrimSpace(strings.ToLower(status))
	if status == "" {
		return "active"
	}
	return status
}

func (s *Service) Create(ctx context.Context, input CreateInput) (*ent.User, error) {
	if input.OrganizationID == uuid.Nil {
		return nil, ErrInvalidInput
	}

	email := normalizeEmail(input.Email)
	if email == "" || input.Password == "" {
		return nil, ErrInvalidInput
	}

	if err := s.ensureOrganization(ctx, input.OrganizationID); err != nil {
		return nil, err
	}

	hash, err := auth.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	role := normalizeRole(input.Role)
	status := normalizeStatus(input.Status)
	metadata := input.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	user, err := s.client.User.Create().
		SetOrganizationID(input.OrganizationID).
		SetEmail(email).
		SetPasswordHash(hash).
		SetRole(role).
		SetStatus(status).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrEmailAlreadyUsed
		}
		return nil, err
	}
	return user, nil
}

func (s *Service) Get(ctx context.Context, orgID, userID uuid.UUID) (*ent.User, error) {
	user, err := s.client.User.Query().
		Where(entuser.IDEQ(userID), entuser.OrganizationIDEQ(orgID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *Service) GetByEmail(ctx context.Context, orgID uuid.UUID, email string) (*ent.User, error) {
	email = normalizeEmail(email)
	if email == "" {
		return nil, ErrInvalidInput
	}
	user, err := s.client.User.Query().
		Where(entuser.OrganizationIDEQ(orgID), entuser.EmailEQ(email)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID, filter Filter) ([]*ent.User, error) {
	query := s.client.User.Query().
		Where(entuser.OrganizationIDEQ(orgID)).
		Order(ent.Asc(entuser.FieldCreatedAt))

	if role := strings.TrimSpace(filter.Role); role != "" {
		query = query.Where(entuser.RoleEQ(role))
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		query = query.Where(entuser.StatusEQ(status))
	}

	return query.All(ctx)
}

func (s *Service) Update(ctx context.Context, orgID, userID uuid.UUID, input UpdateInput) (*ent.User, error) {
	update := s.client.User.UpdateOneID(userID).
		Where(entuser.OrganizationIDEQ(orgID))

	if input.Email != nil {
		email := normalizeEmail(*input.Email)
		if email == "" {
			return nil, ErrInvalidInput
		}
		update.SetEmail(email)
	}

	if input.Password != nil && *input.Password != "" {
		hash, err := auth.HashPassword(*input.Password)
		if err != nil {
			return nil, err
		}
		update.SetPasswordHash(hash)
		update.ClearRefreshTokenID()
	}

	if input.Role != nil {
		update.SetRole(normalizeRole(*input.Role))
	}

	if input.Status != nil {
		status := normalizeStatus(*input.Status)
		if status == "" {
			return nil, ErrInvalidInput
		}
		update.SetStatus(status)
	}

	if input.Metadata != nil {
		update.SetMetadata(input.Metadata)
	}

	update.SetUpdatedAt(time.Now())

	user, err := update.Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrEmailAlreadyUsed
		}
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *Service) Deactivate(ctx context.Context, orgID, userID uuid.UUID) error {
	return s.setStatus(ctx, orgID, userID, "inactive")
}

func (s *Service) Activate(ctx context.Context, orgID, userID uuid.UUID) error {
	return s.setStatus(ctx, orgID, userID, "active")
}

func (s *Service) setStatus(ctx context.Context, orgID, userID uuid.UUID, status string) error {
	_, err := s.client.User.UpdateOneID(userID).
		Where(entuser.OrganizationIDEQ(orgID)).
		SetStatus(status).
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

func (s *Service) ensureOrganization(ctx context.Context, orgID uuid.UUID) error {
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
