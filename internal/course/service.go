package course

import (
	"context"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"

	"lms-go/internal/ent"
	entcourse "lms-go/internal/ent/course"
	entmodule "lms-go/internal/ent/module"
	entorg "lms-go/internal/ent/organization"
)

const (
	StatusDraft     = "draft"
	StatusPublished = "published"
	StatusArchived  = "archived"
)

var allowedModuleTypes = map[string]bool{
	"scorm":   true,
	"pdf":     true,
	"video":   true,
	"article": true,
	"quiz":    true,
}

type Service struct {
	client *ent.Client
}

func NewService(client *ent.Client) *Service {
	return &Service{client: client}
}

type CreateCourseInput struct {
	OrganizationID uuid.UUID
	Title          string
	Slug           string
	Description    string
	Metadata       map[string]any
}

type UpdateCourseInput struct {
	Title       *string
	Description *string
	Metadata    map[string]any
}

type CourseFilter struct {
	Status string
}

func (s *Service) Create(ctx context.Context, input CreateCourseInput) (*ent.Course, error) {
	if input.OrganizationID == uuid.Nil {
		return nil, ErrInvalidInput
	}
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return nil, ErrInvalidInput
	}

	if err := s.ensureOrg(ctx, input.OrganizationID); err != nil {
		return nil, err
	}

	slug := sanitizeSlug(input.Slug)
	if slug == "" {
		slug = sanitizeSlug(title)
	}
	if slug == "" {
		return nil, ErrInvalidInput
	}

	metadata := input.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	course, err := s.client.Course.Create().
		SetOrganizationID(input.OrganizationID).
		SetTitle(title).
		SetSlug(slug).
		SetDescription(strings.TrimSpace(input.Description)).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrSlugTaken
		}
		return nil, err
	}
	return course, nil
}

func (s *Service) Get(ctx context.Context, orgID, courseID uuid.UUID) (*ent.Course, error) {
	course, err := s.client.Course.Query().
		Where(entcourse.IDEQ(courseID), entcourse.OrganizationIDEQ(orgID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return course, nil
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID, filter CourseFilter) ([]*ent.Course, error) {
	query := s.client.Course.Query().
		Where(entcourse.OrganizationIDEQ(orgID)).
		Order(entcourse.ByCreatedAt())
	if status := strings.TrimSpace(filter.Status); status != "" {
		query = query.Where(entcourse.StatusEQ(status))
	}
	return query.All(ctx)
}

func (s *Service) Update(ctx context.Context, orgID, courseID uuid.UUID, input UpdateCourseInput) (*ent.Course, error) {
	update := s.client.Course.UpdateOneID(courseID).
		Where(entcourse.OrganizationIDEQ(orgID)).
		SetUpdatedAt(time.Now())

	if input.Title != nil {
		title := strings.TrimSpace(*input.Title)
		if title == "" {
			return nil, ErrInvalidInput
		}
		update.SetTitle(title)
	}
	if input.Description != nil {
		update.SetDescription(strings.TrimSpace(*input.Description))
	}
	if input.Metadata != nil {
		update.SetMetadata(input.Metadata)
	}

	course, err := update.Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return course, nil
}

func (s *Service) Publish(ctx context.Context, orgID, courseID uuid.UUID) (*ent.Course, error) {
	return s.setStatus(ctx, orgID, courseID, StatusPublished)
}

func (s *Service) Unpublish(ctx context.Context, orgID, courseID uuid.UUID) (*ent.Course, error) {
	return s.setStatus(ctx, orgID, courseID, StatusDraft)
}

func (s *Service) Archive(ctx context.Context, orgID, courseID uuid.UUID) (*ent.Course, error) {
	return s.setStatus(ctx, orgID, courseID, StatusArchived)
}

func (s *Service) setStatus(ctx context.Context, orgID, courseID uuid.UUID, status string) (*ent.Course, error) {
	update := s.client.Course.UpdateOneID(courseID).
		Where(entcourse.OrganizationIDEQ(orgID)).
		SetStatus(status).
		SetUpdatedAt(time.Now())
	if status == StatusPublished {
		update.SetPublishedAt(time.Now())
	}
	course, err := update.Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return course, nil
}

type ModuleInput struct {
	Title        string
	ModuleType   string
	ContentID    *uuid.UUID
	DurationSecs int
	Data         map[string]any
}

func (s *Service) AddModule(ctx context.Context, orgID, courseID uuid.UUID, input ModuleInput) (*ent.Module, error) {
	if err := s.ensureCourse(ctx, orgID, courseID); err != nil {
		return nil, err
	}

	title := strings.TrimSpace(input.Title)
	if title == "" {
		return nil, ErrInvalidInput
	}
	moduleType := strings.TrimSpace(strings.ToLower(input.ModuleType))
	if !allowedModuleTypes[moduleType] {
		return nil, ErrInvalidInput
	}

	position, err := s.nextModulePosition(ctx, courseID)
	if err != nil {
		return nil, err
	}

	builder := s.client.Module.Create().
		SetCourseID(courseID).
		SetTitle(title).
		SetModuleType(moduleType).
		SetPosition(position)

	if input.ContentID != nil {
		builder.SetContentID(*input.ContentID)
	}
	if input.DurationSecs > 0 {
		builder.SetDurationSeconds(input.DurationSecs)
	}
	if input.Data != nil {
		builder.SetData(input.Data)
	}

	module, err := builder.Save(ctx)
	if err != nil {
		return nil, err
	}
	return module, nil
}

func (s *Service) UpdateModule(ctx context.Context, orgID, moduleID uuid.UUID, input ModuleInput) (*ent.Module, error) {
	module, err := s.client.Module.Query().
		Where(entmodule.IDEQ(moduleID)).
		WithCourse(func(q *ent.CourseQuery) {
			q.Where(entcourse.OrganizationIDEQ(orgID))
		}).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	update := s.client.Module.UpdateOne(module)

	if input.Title != "" {
		update.SetTitle(strings.TrimSpace(input.Title))
	}
	if input.ModuleType != "" {
		moduleType := strings.TrimSpace(strings.ToLower(input.ModuleType))
		if !allowedModuleTypes[moduleType] {
			return nil, ErrInvalidInput
		}
		update.SetModuleType(moduleType)
	}
	if input.ContentID != nil {
		update.SetContentID(*input.ContentID)
	}
	if input.Data != nil {
		update.SetData(input.Data)
	}
	if input.DurationSecs > 0 {
		update.SetDurationSeconds(input.DurationSecs)
	}
	update.SetUpdatedAt(time.Now())

	mod, err := update.Save(ctx)
	if err != nil {
		return nil, err
	}
	return mod, nil
}

func (s *Service) ListModules(ctx context.Context, orgID, courseID uuid.UUID) ([]*ent.Module, error) {
	if err := s.ensureCourse(ctx, orgID, courseID); err != nil {
		return nil, err
	}
	return s.client.Module.Query().
		Where(entmodule.CourseIDEQ(courseID)).
		Order(entmodule.ByPosition()).
		All(ctx)
}

func (s *Service) ReorderModules(ctx context.Context, orgID, courseID uuid.UUID, moduleIDs []uuid.UUID) error {
	modules, err := s.ListModules(ctx, orgID, courseID)
	if err != nil {
		return err
	}
	if len(modules) != len(moduleIDs) {
		return ErrInvalidInput
	}

	index := make(map[uuid.UUID]int, len(moduleIDs))
	for pos, id := range moduleIDs {
		index[id] = pos
	}

	for _, m := range modules {
		pos, ok := index[m.ID]
		if !ok {
			return ErrInvalidInput
		}
		if m.Position != pos {
			if _, err := s.client.Module.UpdateOneID(m.ID).SetPosition(pos).Save(ctx); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *Service) RemoveModule(ctx context.Context, orgID, moduleID uuid.UUID) error {
	module, err := s.client.Module.Query().
		Where(entmodule.IDEQ(moduleID)).
		WithCourse(func(q *ent.CourseQuery) {
			q.Where(entcourse.OrganizationIDEQ(orgID))
		}).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return ErrNotFound
		}
		return err
	}
	if err := s.client.Module.DeleteOne(module).Exec(ctx); err != nil {
		return err
	}
	return nil
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

func (s *Service) ensureCourse(ctx context.Context, orgID, courseID uuid.UUID) error {
	exists, err := s.client.Course.Query().
		Where(entcourse.IDEQ(courseID), entcourse.OrganizationIDEQ(orgID)).
		Exist(ctx)
	if err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}
	return nil
}

func (s *Service) nextModulePosition(ctx context.Context, courseID uuid.UUID) (int, error) {
	modules, err := s.client.Module.Query().
		Where(entmodule.CourseIDEQ(courseID)).
		All(ctx)
	if err != nil {
		return 0, err
	}
	maxPos := -1
	for _, m := range modules {
		if m.Position > maxPos {
			maxPos = m.Position
		}
	}
	return maxPos + 1, nil
}

func sanitizeSlug(raw string) string {
	slug := strings.TrimSpace(strings.ToLower(raw))
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	slug = strings.ReplaceAll(slug, "--", "-")
	slug = strings.Trim(slug, "-")
	return slug
}

// AllowedModuleTypes retourne la liste triée des types de modules supportés.
func AllowedModuleTypes() []string {
	types := make([]string, 0, len(allowedModuleTypes))
	for t := range allowedModuleTypes {
		types = append(types, t)
	}
	sort.Strings(types)
	return types
}
