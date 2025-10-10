package user

import (
	"context"
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/ent"

	_ "github.com/glebarez/go-sqlite"
)

func newUserService(t *testing.T) (*Service, uuid.UUID, func()) {
	t.Helper()
	db, err := sql.Open("sqlite", "file:usersvc?mode=memory&cache=shared")
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

func TestService_CreateList(t *testing.T) {
	svc, orgID, cleanup := newUserService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	user, err := svc.Create(ctx, CreateInput{
		OrganizationID: orgID,
		Email:          "User@example.com",
		Password:       "supersecret",
		Role:           "admin",
	})
	require.NoError(t, err)
	require.Equal(t, "user@example.com", user.Email)
	require.Equal(t, "admin", user.Role)

	// Duplicate email
	_, err = svc.Create(ctx, CreateInput{
		OrganizationID: orgID,
		Email:          "user@example.com",
		Password:       "anotherpass",
	})
	require.ErrorIs(t, err, ErrEmailAlreadyUsed)

	users, err := svc.List(ctx, orgID, Filter{})
	require.NoError(t, err)
	require.Len(t, users, 1)
}

func TestService_UpdateAndDeactivate(t *testing.T) {
	svc, orgID, cleanup := newUserService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	user, err := svc.Create(ctx, CreateInput{
		OrganizationID: orgID,
		Email:          "user2@example.com",
		Password:       "supersecret",
	})
	require.NoError(t, err)

	newRole := "tutor"
	newStatus := "active"
	newPassword := "freshpass123"
	updated, err := svc.Update(ctx, orgID, user.ID, UpdateInput{
		Role:     &newRole,
		Status:   &newStatus,
		Password: &newPassword,
	})
	require.NoError(t, err)
	require.Equal(t, newRole, updated.Role)

	require.NoError(t, svc.Deactivate(ctx, orgID, user.ID))
	inactive, err := svc.Get(ctx, orgID, user.ID)
	require.NoError(t, err)
	require.Equal(t, "inactive", inactive.Status)

	require.NoError(t, svc.Activate(ctx, orgID, user.ID))
	active, err := svc.Get(ctx, orgID, user.ID)
	require.NoError(t, err)
	require.Equal(t, "active", active.Status)
}

func TestService_GetByEmail(t *testing.T) {
	svc, orgID, cleanup := newUserService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	_, err := svc.Create(ctx, CreateInput{
		OrganizationID: orgID,
		Email:          "owner@example.com",
		Password:       "supersecret",
	})
	require.NoError(t, err)

	user, err := svc.GetByEmail(ctx, orgID, "OWNER@example.com")
	require.NoError(t, err)
	require.Equal(t, "owner@example.com", user.Email)

	_, err = svc.GetByEmail(ctx, orgID, "unknown@example.com")
	require.ErrorIs(t, err, ErrNotFound)
}

func TestService_InvalidInput(t *testing.T) {
	svc, orgID, cleanup := newUserService(t)
	t.Cleanup(cleanup)
	ctx := context.Background()

	_, err := svc.Create(ctx, CreateInput{OrganizationID: orgID})
	require.ErrorIs(t, err, ErrInvalidInput)

	user, err := svc.Create(ctx, CreateInput{
		OrganizationID: orgID,
		Email:          "valid@example.com",
		Password:       "supersecret",
	})
	require.NoError(t, err)

	empty := ""
	_, err = svc.Update(ctx, orgID, user.ID, UpdateInput{Email: &empty})
	require.ErrorIs(t, err, ErrInvalidInput)
}
