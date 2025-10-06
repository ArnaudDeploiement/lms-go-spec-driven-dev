package progress

import (
	"context"
	"time"

	"github.com/google/uuid"

	enrollment "lms-go/internal/enrollment"
	"lms-go/internal/ent"
	entenrollment "lms-go/internal/ent/enrollment"
	entmodule "lms-go/internal/ent/module"
	entmoduleprogress "lms-go/internal/ent/moduleprogress"
)

const (
	StatusNotStarted = "not_started"
	StatusInProgress = "in_progress"
	StatusCompleted  = "completed"
)

type Service struct {
	client *ent.Client
}

func NewService(client *ent.Client) *Service {
	return &Service{client: client}
}

// ModuleState représente l'état d'un module pour un utilisateur.
type ModuleState struct {
	Module   *ent.Module
	Progress *ent.ModuleProgress
}

// Start marque un module comme démarré pour une inscription donnée, en vérifiant la progression linéaire.
func (s *Service) Start(ctx context.Context, orgID, enrollmentID, moduleID uuid.UUID) (*ent.ModuleProgress, error) {
	enrollmentEntity, err := s.client.Enrollment.Query().
		Where(entenrollment.IDEQ(enrollmentID), entenrollment.OrganizationIDEQ(orgID)).
		WithCourse().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	module, err := s.client.Module.Query().
		Where(entmodule.IDEQ(moduleID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrInvalidInput
		}
		return nil, err
	}

	if module.CourseID != enrollmentEntity.CourseID {
		return nil, ErrInvalidInput
	}

	if err := s.ensurePrerequisitesCompleted(ctx, enrollmentEntity.ID, module.CourseID, module.Position); err != nil {
		return nil, err
	}

	existing, err := s.client.ModuleProgress.Query().
		Where(entmoduleprogress.EnrollmentIDEQ(enrollmentID), entmoduleprogress.ModuleIDEQ(moduleID)).
		Only(ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	now := time.Now()
	if existing != nil {
		update := existing.Update().
			SetStatus(StatusInProgress).
			SetUpdatedAt(now)
		if existing.StartedAt == nil {
			update.SetStartedAt(now)
		}
		return update.Save(ctx)
	}

	progress, err := s.client.ModuleProgress.Create().
		SetEnrollmentID(enrollmentID).
		SetModuleID(moduleID).
		SetStatus(StatusInProgress).
		SetStartedAt(now).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return progress, nil
}

// Complete marque un module comme terminé et met à jour la progression globale de l'inscription.
func (s *Service) Complete(ctx context.Context, orgID, enrollmentID, moduleID uuid.UUID, score *float32) (*ent.ModuleProgress, error) {
	mp, err := s.Start(ctx, orgID, enrollmentID, moduleID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	updater := mp.Update().
		SetStatus(StatusCompleted).
		SetCompletedAt(now).
		SetUpdatedAt(now)
	if score != nil {
		updater.SetScore(*score)
		updater.AddAttempts(1)
	}

	entity, err := updater.Save(ctx)
	if err != nil {
		return nil, err
	}

	if err := s.updateEnrollmentProgress(ctx, orgID, enrollmentID); err != nil {
		return entity, err
	}
	return entity, nil
}

// Get renvoie tous les modules d'un cours avec leur état pour une inscription donnée.
func (s *Service) Get(ctx context.Context, orgID, enrollmentID uuid.UUID) ([]ModuleState, error) {
	enrollmentEntity, err := s.client.Enrollment.Query().
		Where(entenrollment.IDEQ(enrollmentID), entenrollment.OrganizationIDEQ(orgID)).
		WithCourse(func(q *ent.CourseQuery) { q.WithModules() }).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	progresses, err := s.client.ModuleProgress.Query().
		Where(entmoduleprogress.EnrollmentIDEQ(enrollmentID)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	progressByModule := make(map[uuid.UUID]*ent.ModuleProgress, len(progresses))
	for _, p := range progresses {
		progressByModule[p.ModuleID] = p
	}

	modules, err := s.client.Module.Query().
		Where(entmodule.CourseIDEQ(enrollmentEntity.CourseID)).
		Order(entmodule.ByPosition()).
		All(ctx)
	if err != nil {
		return nil, err
	}

	states := make([]ModuleState, 0, len(modules))
	for _, m := range modules {
		states = append(states, ModuleState{
			Module:   m,
			Progress: progressByModule[m.ID],
		})
	}
	return states, nil
}

func (s *Service) ensurePrerequisitesCompleted(ctx context.Context, enrollmentID, courseID uuid.UUID, modulePosition int) error {
	if modulePosition == 0 {
		return nil
	}
	previous, err := s.client.Module.Query().
		Where(entmodule.CourseIDEQ(courseID), entmodule.PositionLT(modulePosition)).
		All(ctx)
	if err != nil {
		return err
	}
	if len(previous) == 0 {
		return nil
	}

	completed, err := s.client.ModuleProgress.Query().
		Where(entmoduleprogress.EnrollmentIDEQ(enrollmentID), entmoduleprogress.StatusEQ(StatusCompleted)).
		All(ctx)
	if err != nil {
		return err
	}
	completedSet := make(map[uuid.UUID]struct{}, len(completed))
	for _, p := range completed {
		completedSet[p.ModuleID] = struct{}{}
	}
	for _, m := range previous {
		if _, ok := completedSet[m.ID]; !ok {
			return ErrBlocked
		}
	}
	return nil
}

func (s *Service) updateEnrollmentProgress(ctx context.Context, orgID, enrollmentID uuid.UUID) error {
	enrollmentEntity, err := s.client.Enrollment.Query().
		Where(entenrollment.IDEQ(enrollmentID), entenrollment.OrganizationIDEQ(orgID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return ErrNotFound
		}
		return err
	}

	totalModules, err := s.client.Module.Query().
		Where(entmodule.CourseIDEQ(enrollmentEntity.CourseID)).
		Count(ctx)
	if err != nil || totalModules == 0 {
		return err
	}

	completedCount, err := s.client.ModuleProgress.Query().
		Where(entmoduleprogress.EnrollmentIDEQ(enrollmentID), entmoduleprogress.StatusEQ(StatusCompleted)).
		Count(ctx)
	if err != nil {
		return err
	}
	progressPercent := float32(completedCount) / float32(totalModules) * 100

	enrollmentUpdate := s.client.Enrollment.UpdateOneID(enrollmentID).
		SetProgress(progressPercent).
		SetUpdatedAt(time.Now())
	if completedCount == totalModules {
		now := time.Now()
		enrollmentUpdate.
			SetStatus(enrollment.StatusCompleted).
			SetCompletedAt(now)
	}
	_, err = enrollmentUpdate.Save(ctx)
	return err
}
