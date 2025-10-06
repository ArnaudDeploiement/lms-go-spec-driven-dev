package enrollment

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"lms-go/internal/ent"
	entcourse "lms-go/internal/ent/course"
	entenrollment "lms-go/internal/ent/enrollment"
	entgroup "lms-go/internal/ent/group"
	entorg "lms-go/internal/ent/organization"
	entuser "lms-go/internal/ent/user"
)

const (
	StatusPending    = "pending"
	StatusActive     = "active"
	StatusCompleted  = "completed"
	StatusCancelled  = "cancelled"
	StatusWaitlisted = "waitlisted"
)

type Service struct {
	client *ent.Client
}

func NewService(client *ent.Client) *Service {
	return &Service{client: client}
}

type EnrollInput struct {
	OrganizationID uuid.UUID
	CourseID       uuid.UUID
	UserID         uuid.UUID
	GroupID        *uuid.UUID
	Metadata       map[string]any
}

type EnrollmentFilter struct {
	CourseID uuid.UUID
	UserID   uuid.UUID
	GroupID  uuid.UUID
	Status   string
}

func (s *Service) Enroll(ctx context.Context, input EnrollInput) (*ent.Enrollment, error) {
	if input.OrganizationID == uuid.Nil || input.CourseID == uuid.Nil || input.UserID == uuid.Nil {
		return nil, ErrInvalidInput
	}
	if err := s.ensureOrg(ctx, input.OrganizationID); err != nil {
		return nil, err
	}
	if err := s.ensureCourse(ctx, input.OrganizationID, input.CourseID); err != nil {
		return nil, err
	}
	if err := s.ensureUser(ctx, input.OrganizationID, input.UserID); err != nil {
		return nil, err
	}

	exists, err := s.client.Enrollment.Query().
		Where(entenrollment.OrganizationIDEQ(input.OrganizationID), entenrollment.CourseIDEQ(input.CourseID), entenrollment.UserIDEQ(input.UserID)).
		Exist(ctx)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrAlreadyEnrolled
	}

	metadata := input.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	status := StatusActive
	builder := s.client.Enrollment.Create().
		SetOrganizationID(input.OrganizationID).
		SetCourseID(input.CourseID).
		SetUserID(input.UserID).
		SetStatus(status).
		SetMetadata(metadata)

	if input.GroupID != nil {
		gid := *input.GroupID
		if err := s.ensureGroup(ctx, input.OrganizationID, gid, input.CourseID); err != nil {
			return nil, err
		}
		builder.SetGroupID(gid)
		if s.groupAtCapacity(ctx, gid) {
			status = StatusWaitlisted
			builder.SetStatus(status)
		}
	}

	if status == StatusActive {
		builder.SetStartedAt(time.Now())
	}

	enrollment, err := builder.Save(ctx)
	if err != nil {
		return nil, err
	}
	return enrollment, nil
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID, filter EnrollmentFilter) ([]*ent.Enrollment, error) {
	query := s.client.Enrollment.Query().
		Where(entenrollment.OrganizationIDEQ(orgID)).
		Order(entenrollment.ByCreatedAt())

	if filter.CourseID != uuid.Nil {
		query = query.Where(entenrollment.CourseIDEQ(filter.CourseID))
	}
	if filter.UserID != uuid.Nil {
		query = query.Where(entenrollment.UserIDEQ(filter.UserID))
	}
	if filter.GroupID != uuid.Nil {
		query = query.Where(entenrollment.GroupIDEQ(filter.GroupID))
	}
	if strings.TrimSpace(filter.Status) != "" {
		query = query.Where(entenrollment.StatusEQ(filter.Status))
	}
	return query.All(ctx)
}

type UpdateInput struct {
	Status      *string
	Progress    *float32
	Metadata    map[string]any
	GroupID     *uuid.UUID
	StartedAt   *time.Time
	CompletedAt *time.Time
}

func (s *Service) Update(ctx context.Context, orgID, enrollmentID uuid.UUID, input UpdateInput) (*ent.Enrollment, error) {
	update := s.client.Enrollment.UpdateOneID(enrollmentID).
		Where(entenrollment.OrganizationIDEQ(orgID)).
		SetUpdatedAt(time.Now())

	if input.Status != nil {
		update.SetStatus(*input.Status)
		if *input.Status == StatusActive && input.StartedAt == nil {
			now := time.Now()
			input.StartedAt = &now
		}
	}
	if input.Progress != nil {
		progress := clampProgress(*input.Progress)
		update.SetProgress(progress)
		if progress >= 100 && input.CompletedAt == nil {
			now := time.Now()
			input.CompletedAt = &now
		}
	}
	if input.Metadata != nil {
		update.SetMetadata(input.Metadata)
	}
	if input.GroupID != nil {
		gid := *input.GroupID
		if gid == uuid.Nil {
			update.ClearGroupID()
		} else {
			if err := s.ensureGroup(ctx, orgID, gid, uuid.Nil); err != nil {
				return nil, err
			}
			update.SetGroupID(gid)
		}
	}
	if input.StartedAt != nil {
		update.SetStartedAt(*input.StartedAt)
	}
	if input.CompletedAt != nil {
		update.SetCompletedAt(*input.CompletedAt)
	}

	entity, err := update.Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return entity, nil
}

func (s *Service) Cancel(ctx context.Context, orgID, enrollmentID uuid.UUID) error {
	_, err := s.client.Enrollment.UpdateOneID(enrollmentID).
		Where(entenrollment.OrganizationIDEQ(orgID)).
		SetStatus(StatusCancelled).
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

type CreateGroupInput struct {
	OrganizationID uuid.UUID
	CourseID       *uuid.UUID
	Name           string
	Description    string
	Capacity       *int
	Metadata       map[string]any
}

type UpdateGroupInput struct {
	Name        *string
	Description *string
	Capacity    *int
	Metadata    map[string]any
}

type GroupFilter struct {
	CourseID uuid.UUID
}

func (s *Service) CreateGroup(ctx context.Context, input CreateGroupInput) (*ent.Group, error) {
	if input.OrganizationID == uuid.Nil || strings.TrimSpace(input.Name) == "" {
		return nil, ErrInvalidInput
	}
	if err := s.ensureOrg(ctx, input.OrganizationID); err != nil {
		return nil, err
	}

	builder := s.client.Group.Create().
		SetOrganizationID(input.OrganizationID).
		SetName(strings.TrimSpace(input.Name)).
		SetDescription(strings.TrimSpace(input.Description))

	if input.Capacity != nil && *input.Capacity > 0 {
		builder.SetCapacity(*input.Capacity)
	}
	if input.CourseID != nil {
		if err := s.ensureCourse(ctx, input.OrganizationID, *input.CourseID); err != nil {
			return nil, err
		}
		builder.SetCourseID(*input.CourseID)
	}
	if input.Metadata != nil {
		builder.SetMetadata(input.Metadata)
	}

	group, err := builder.Save(ctx)
	if err != nil {
		return nil, err
	}
	return group, nil
}

func (s *Service) ListGroups(ctx context.Context, orgID uuid.UUID, filter GroupFilter) ([]*ent.Group, error) {
	query := s.client.Group.Query().
		Where(entgroup.OrganizationIDEQ(orgID)).
		Order(entgroup.ByCreatedAt())
	if filter.CourseID != uuid.Nil {
		query = query.Where(entgroup.CourseIDEQ(filter.CourseID))
	}
	return query.All(ctx)
}

func (s *Service) UpdateGroup(ctx context.Context, orgID, groupID uuid.UUID, input UpdateGroupInput) (*ent.Group, error) {
	update := s.client.Group.UpdateOneID(groupID).
		Where(entgroup.OrganizationIDEQ(orgID)).
		SetUpdatedAt(time.Now())

	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return nil, ErrInvalidInput
		}
		update.SetName(name)
	}
	if input.Description != nil {
		update.SetDescription(strings.TrimSpace(*input.Description))
	}
	if input.Capacity != nil {
		cap := *input.Capacity
		if cap < 0 {
			return nil, ErrInvalidInput
		}
		update.SetCapacity(cap)
	}
	if input.Metadata != nil {
		update.SetMetadata(input.Metadata)
	}

	group, err := update.Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return group, nil
}

func (s *Service) DeleteGroup(ctx context.Context, orgID, groupID uuid.UUID) error {
	err := s.client.Group.DeleteOneID(groupID).
		Where(entgroup.OrganizationIDEQ(orgID)).
		Exec(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return ErrNotFound
		}
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
		return ErrInvalidInput
	}
	return nil
}

func (s *Service) ensureUser(ctx context.Context, orgID, userID uuid.UUID) error {
	exists, err := s.client.User.Query().
		Where(entuser.IDEQ(userID), entuser.OrganizationIDEQ(orgID)).
		Exist(ctx)
	if err != nil {
		return err
	}
	if !exists {
		return ErrInvalidInput
	}
	return nil
}

func (s *Service) ensureGroup(ctx context.Context, orgID, groupID uuid.UUID, courseID uuid.UUID) error {
	group, err := s.client.Group.Query().
		Where(entgroup.IDEQ(groupID), entgroup.OrganizationIDEQ(orgID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return ErrInvalidInput
		}
		return err
	}
	if courseID != uuid.Nil && group.CourseID != nil && *group.CourseID != courseID {
		return ErrInvalidInput
	}
	return nil
}

func (s *Service) groupAtCapacity(ctx context.Context, groupID uuid.UUID) bool {
	group, err := s.client.Group.Get(ctx, groupID)
	if err != nil || group.Capacity == nil || *group.Capacity <= 0 {
		return false
	}
	count, err := s.client.Enrollment.Query().
		Where(entenrollment.GroupIDEQ(groupID), entenrollment.StatusNEQ(StatusWaitlisted), entenrollment.StatusNEQ(StatusCancelled)).
		Count(ctx)
	if err != nil {
		return false
	}
	return count >= *group.Capacity
}

func clampProgress(v float32) float32 {
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return v
}
