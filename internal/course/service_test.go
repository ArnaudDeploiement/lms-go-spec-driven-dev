package course

import (
	"context"
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/ent"
	entenrollment "lms-go/internal/ent/enrollment"
	entmodule "lms-go/internal/ent/module"
	entmoduleprogress "lms-go/internal/ent/moduleprogress"

	_ "github.com/glebarez/go-sqlite"
)

func newCourseService(t *testing.T) (*Service, uuid.UUID, func()) {
	db, err := sql.Open("sqlite", "file:coursesvc?mode=memory&cache=shared")
	require.NoError(t, err)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	driver := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(driver))
	ctx := context.Background()
	require.NoError(t, client.Schema.Create(ctx))

	org, err := client.Organization.Create().
		SetName("Org").
		SetSlug("org").
		Save(ctx)
	require.NoError(t, err)

	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}

	return NewService(client), org.ID, cleanup
}

func TestCourseLifecycle(t *testing.T) {
	svc, orgID, cleanup := newCourseService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	course, err := svc.Create(ctx, CreateCourseInput{
		OrganizationID: orgID,
		Title:          "Onboarding",
		Slug:           "onboarding",
		Description:    "desc",
	})
	require.NoError(t, err)
	require.Equal(t, StatusDraft, course.Status)

	listed, err := svc.List(ctx, orgID, CourseFilter{})
	require.NoError(t, err)
	require.Len(t, listed, 1)

	updated, err := svc.Update(ctx, orgID, course.ID, UpdateCourseInput{Description: ptr("updated")})
	require.NoError(t, err)
	require.Equal(t, "updated", updated.Description)

	published, err := svc.Publish(ctx, orgID, course.ID)
	require.NoError(t, err)
	require.Equal(t, StatusPublished, published.Status)

	archived, err := svc.Archive(ctx, orgID, course.ID)
	require.NoError(t, err)
	require.Equal(t, StatusArchived, archived.Status)
}

func TestModuleOperations(t *testing.T) {
	svc, orgID, cleanup := newCourseService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	course, err := svc.Create(ctx, CreateCourseInput{
		OrganizationID: orgID,
		Title:          "Security",
		Slug:           "security",
	})
	require.NoError(t, err)

	module, err := svc.AddModule(ctx, orgID, course.ID, ModuleInput{
		Title:      "Intro",
		ModuleType: "article",
	})
	require.NoError(t, err)
	require.Equal(t, 0, module.Position)

	mod2, err := svc.AddModule(ctx, orgID, course.ID, ModuleInput{
		Title:      "Quiz",
		ModuleType: "quiz",
	})
	require.NoError(t, err)
	require.Equal(t, 1, mod2.Position)

	user, err := svc.client.User.Create().
		SetOrganizationID(orgID).
		SetEmail("learner@example.com").
		SetPasswordHash("hashed").
		Save(ctx)
	require.NoError(t, err)

	enrollment, err := svc.client.Enrollment.Create().
		SetOrganizationID(orgID).
		SetCourseID(course.ID).
		SetUserID(user.ID).
		Save(ctx)
	require.NoError(t, err)

	_, err = svc.client.ModuleProgress.Create().
		SetEnrollmentID(enrollment.ID).
		SetModuleID(module.ID).
		Save(ctx)
	require.NoError(t, err)

	// Reorder
	require.NoError(t, svc.ReorderModules(ctx, orgID, course.ID, []uuid.UUID{mod2.ID, module.ID}))
	modules, err := svc.ListModules(ctx, orgID, course.ID)
	require.NoError(t, err)
	require.Equal(t, mod2.ID, modules[0].ID)

	// Update module
	updated, err := svc.UpdateModule(ctx, orgID, mod2.ID, ModuleInput{Title: "Quiz final"})
	require.NoError(t, err)
	require.Equal(t, "Quiz final", updated.Title)

	// Delete module
	require.NoError(t, svc.RemoveModule(ctx, orgID, module.ID))
	count, err := svc.client.ModuleProgress.Query().
		Where(entmoduleprogress.ModuleIDEQ(module.ID)).
		Count(ctx)
	require.NoError(t, err)
	require.Zero(t, count)
	modules, err = svc.ListModules(ctx, orgID, course.ID)
	require.NoError(t, err)
	require.Len(t, modules, 1)
}

func TestDeleteCourseRemovesDependencies(t *testing.T) {
	svc, orgID, cleanup := newCourseService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	course, err := svc.Create(ctx, CreateCourseInput{
		OrganizationID: orgID,
		Title:          "Compliance",
		Slug:           "compliance",
	})
	require.NoError(t, err)

	module, err := svc.AddModule(ctx, orgID, course.ID, ModuleInput{
		Title:      "Module 1",
		ModuleType: "article",
	})
	require.NoError(t, err)

	user, err := svc.client.User.Create().
		SetOrganizationID(orgID).
		SetEmail("learner2@example.com").
		SetPasswordHash("hashed").
		Save(ctx)
	require.NoError(t, err)

	group, err := svc.client.Group.Create().
		SetOrganizationID(orgID).
		SetCourseID(course.ID).
		SetName("Groupe A").
		Save(ctx)
	require.NoError(t, err)
	require.NotNil(t, group.CourseID)
	require.Equal(t, course.ID, *group.CourseID)

	enrollment, err := svc.client.Enrollment.Create().
		SetOrganizationID(orgID).
		SetCourseID(course.ID).
		SetUserID(user.ID).
		Save(ctx)
	require.NoError(t, err)

	_, err = svc.client.ModuleProgress.Create().
		SetEnrollmentID(enrollment.ID).
		SetModuleID(module.ID).
		Save(ctx)
	require.NoError(t, err)

	require.NoError(t, svc.Delete(ctx, orgID, course.ID))

	_, err = svc.Get(ctx, orgID, course.ID)
	require.ErrorIs(t, err, ErrNotFound)

	moduleCount, err := svc.client.Module.Query().Where(entmodule.CourseIDEQ(course.ID)).Count(ctx)
	require.NoError(t, err)
	require.Zero(t, moduleCount)

	progressCount, err := svc.client.ModuleProgress.Query().Where(entmoduleprogress.EnrollmentIDEQ(enrollment.ID)).Count(ctx)
	require.NoError(t, err)
	require.Zero(t, progressCount)

	enrollmentCount, err := svc.client.Enrollment.Query().Where(entenrollment.CourseIDEQ(course.ID)).Count(ctx)
	require.NoError(t, err)
	require.Zero(t, enrollmentCount)

	updatedGroup, err := svc.client.Group.Get(ctx, group.ID)
	require.NoError(t, err)
	require.Nil(t, updatedGroup.CourseID)
}

func ptr(s string) *string { return &s }
