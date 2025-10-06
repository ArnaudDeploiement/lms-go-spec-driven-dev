package enrollment

import (
	"context"
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/course"
	"lms-go/internal/ent"
	"lms-go/internal/organization"
	"lms-go/internal/user"

	_ "github.com/glebarez/go-sqlite"
)

func newEnrollmentSvc(t *testing.T) (*Service, uuid.UUID, uuid.UUID, uuid.UUID, func()) {
	db, err := sql.Open("sqlite", "file:enrolltests?mode=memory&cache=shared")
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

	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}
	return NewService(client), org.ID, usr.ID, crs.ID, cleanup
}

func TestEnrollmentLifecycle(t *testing.T) {
	svc, orgID, userID, courseID, cleanup := newEnrollmentSvc(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	enrollment, err := svc.Enroll(ctx, EnrollInput{OrganizationID: orgID, CourseID: courseID, UserID: userID})
	require.NoError(t, err)
	require.Equal(t, StatusActive, enrollment.Status)

	progress := float32(50)
	_, err = svc.Update(ctx, orgID, enrollment.ID, UpdateInput{Progress: &progress})
	require.NoError(t, err)

	require.NoError(t, svc.Cancel(ctx, orgID, enrollment.ID))
}

func TestGroupCapacity(t *testing.T) {
	svc, orgID, userID, courseID, cleanup := newEnrollmentSvc(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	capacity := 1
	group, err := svc.CreateGroup(ctx, CreateGroupInput{
		OrganizationID: orgID,
		CourseID:       &courseID,
		Name:           "Batch A",
		Capacity:       &capacity,
	})
	require.NoError(t, err)

	enrollment, err := svc.Enroll(ctx, EnrollInput{OrganizationID: orgID, CourseID: courseID, UserID: userID, GroupID: &group.ID})
	require.NoError(t, err)
	require.Equal(t, StatusActive, enrollment.Status)

	userSvc := user.NewService(svc.client)
	usr2, err := userSvc.Create(ctx, user.CreateInput{
		OrganizationID: orgID,
		Email:          "second@example.com",
		Password:       "supersecret",
	})
	require.NoError(t, err)

	second, err := svc.Enroll(ctx, EnrollInput{OrganizationID: orgID, CourseID: courseID, UserID: usr2.ID, GroupID: &group.ID})
	require.NoError(t, err)
	require.Equal(t, StatusWaitlisted, second.Status)
}
