package organization

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"

	"lms-go/internal/ent"
	entorg "lms-go/internal/ent/organization"
)

// Service encapsule la logique métier autour des organisations.
type Service struct {
	client *ent.Client
}

func NewService(client *ent.Client) *Service {
	return &Service{client: client}
}

// CreateInput regroupe les champs nécessaires à la création d'une organisation.
type CreateInput struct {
	Name     string
	Slug     string
	Settings map[string]any
}

// UpdateInput regroupe les champs éditables pour une organisation.
type UpdateInput struct {
	Name     *string
	Slug     *string
	Status   *string
	Settings map[string]any
}

var slugSanitizer = regexp.MustCompile(`[^a-z0-9-]+`)

func sanitizeSlug(raw string) string {
	slug := strings.TrimSpace(strings.ToLower(raw))
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = slugSanitizer.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		return raw
	}
	return slug
}

// Create ajoute une nouvelle organisation.
func (s *Service) Create(ctx context.Context, input CreateInput) (*ent.Organization, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, ErrInvalidInput
	}
	slug := sanitizeSlug(input.Slug)
	if slug == "" {
		slug = sanitizeSlug(name)
	}
	if slug == "" {
		return nil, ErrInvalidInput
	}
	settings := input.Settings
	if settings == nil {
		settings = map[string]any{}
	}

	org, err := s.client.Organization.Create().
		SetName(name).
		SetSlug(slug).
		SetSettings(settings).
		Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrSlugAlreadyUsed
		}
		return nil, err
	}
	return org, nil
}

// Get récupère une organisation par son identifiant.
func (s *Service) Get(ctx context.Context, id uuid.UUID) (*ent.Organization, error) {
	org, err := s.client.Organization.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return org, nil
}

// GetBySlug récupère une organisation par son slug.
func (s *Service) GetBySlug(ctx context.Context, slug string) (*ent.Organization, error) {
	org, err := s.client.Organization.Query().
		Where(entorg.SlugEQ(slug)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return org, nil
}

// List renvoie l'ensemble des organisations (avec filtrage optionnel par statut).
func (s *Service) List(ctx context.Context, status string) ([]*ent.Organization, error) {
	query := s.client.Organization.Query().Order(ent.Asc(entorg.FieldCreatedAt))
	if status != "" {
		query = query.Where(entorg.StatusEQ(status))
	}
	return query.All(ctx)
}

// Update modifie une organisation existante.
func (s *Service) Update(ctx context.Context, id uuid.UUID, input UpdateInput) (*ent.Organization, error) {
	update := s.client.Organization.UpdateOneID(id)
	if input.Name != nil {
		update.SetName(strings.TrimSpace(*input.Name))
	}
	if input.Slug != nil {
		slug := sanitizeSlug(*input.Slug)
		if slug == "" {
			return nil, ErrInvalidInput
		}
		update.SetSlug(slug)
	}
	if input.Settings != nil {
		update.SetSettings(input.Settings)
	}
	if input.Status != nil {
		status := strings.TrimSpace(*input.Status)
		if status == "" {
			return nil, ErrInvalidInput
		}
		update.SetStatus(status)
	}
	update.SetUpdatedAt(time.Now())

	org, err := update.Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrSlugAlreadyUsed
		}
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return org, nil
}

// Archive passe l'organisation en statut inactif.
func (s *Service) Archive(ctx context.Context, id uuid.UUID) error {
	return s.updateStatus(ctx, id, "inactive")
}

// Activate repasse l'organisation en actif.
func (s *Service) Activate(ctx context.Context, id uuid.UUID) error {
	return s.updateStatus(ctx, id, "active")
}

func (s *Service) updateStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := s.client.Organization.UpdateOneID(id).
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
