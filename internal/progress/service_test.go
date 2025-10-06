package progress

import (
	"context"
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/course"
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	"lms-go/internal/organization"
	"lms-go/internal/user"

	_ "github.com/glebarez/go-sqlite"
)

func newProgressService(t *testing.T) (*Service, uuid.UUID, uuid.UUID, []uuid.UUID, func()) {
	db, err := sql.Open("sqlite", "file:progresssvc?mode=memory&cache=shared")
	require.NoError(t, err)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	driver := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(driver))
	ctx := context.Background()
	require.NoError(t, client.Schema.Create(ctx))

	orgSvc := organization.NewService(client)
	org, err := orgSvc.Create(ctx, organization.CreateInput{Name: "Org", Slug: "org"})
	require.NoError(t, err)

	userSvc := user.NewService(client)
	usr, err := userSvc.Create(ctx, user.CreateInput{
		OrganizationID: org.ID,
		Email:          "learner@example.com",
		Password:       "supersecret",
	})
	require.NoError(t, err)

	courseSvc := course.NewService(client)
	crs, err := courseSvc.Create(ctx, course.CreateCourseInput{
		OrganizationID: org.ID,
		Title:          "Course",
		Slug:           "course",
	})
	require.NoError(t, err)

	mod1, err := courseSvc.AddModule(ctx, org.ID, crs.ID, course.ModuleInput{Title: "Intro", ModuleType: "article"})
	require.NoError(t, err)
	mod2, err := courseSvc.AddModule(ctx, org.ID, crs.ID, course.ModuleInput{Title: "Quiz", ModuleType: "quiz"})
	require.NoError(t, err)

	enrollSvc := enrollment.NewService(client)
	enr, err := enrollSvc.Enroll(ctx, enrollment.EnrollInput{
		OrganizationID: org.ID,
		CourseID:       crs.ID,
		UserID:         usr.ID,
	})
	require.NoError(t, err)

	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}
	return NewService(client), org.ID, enr.ID, []uuid.UUID{mod1.ID, mod2.ID}, cleanup
}

func TestProgressWorkflow(t *testing.T) {
	svc, orgID, enrollmentID, modules, cleanup := newProgressService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	// start first module
	mp1, err := svc.Start(ctx, orgID, enrollmentID, modules[0])
	require.NoError(t, err)
	require.Equal(t, StatusInProgress, mp1.Status)

	// complete first module
	mp1Done, err := svc.Complete(ctx, orgID, enrollmentID, modules[0], nil)
	require.NoError(t, err)
	require.Equal(t, StatusCompleted, mp1Done.Status)

	// starting second should now work
	mp2, err := svc.Start(ctx, orgID, enrollmentID, modules[1])
	require.NoError(t, err)
	require.Equal(t, StatusInProgress, mp2.Status)

	// progress list should have entries
	states, err := svc.Get(ctx, orgID, enrollmentID)
	require.NoError(t, err)
	require.Len(t, states, 2)
}
