package organization

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

func newTestService(t *testing.T) *Service {
	t.Helper()

	db, err := sql.Open("sqlite", "file:orgsvc?mode=memory&cache=shared")
	require.NoError(t, err)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	driver := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(driver))
	t.Cleanup(func() {
		_ = client.Close()
		_ = db.Close()
	})

	ctx := context.Background()
	require.NoError(t, client.Schema.Create(ctx))

	return NewService(client)
}

func TestService_CreateAndGet(t *testing.T) {
	svc := newTestService(t)
	ctx := context.Background()

	org, err := svc.Create(ctx, CreateInput{
		Name: "Acme Corp",
		Slug: "acme",
	})
	require.NoError(t, err)
	require.Equal(t, "acme", org.Slug)
	require.Equal(t, "active", org.Status)

	_, err = svc.Create(ctx, CreateInput{Name: "Other", Slug: "acme"})
	require.ErrorIs(t, err, ErrSlugAlreadyUsed)

	loaded, err := svc.Get(ctx, org.ID)
	require.NoError(t, err)
	require.Equal(t, org.ID, loaded.ID)

	bySlug, err := svc.GetBySlug(ctx, "acme")
	require.NoError(t, err)
	require.Equal(t, org.ID, bySlug.ID)
}

func TestService_UpdateAndArchive(t *testing.T) {
	svc := newTestService(t)
	ctx := context.Background()

	org, err := svc.Create(ctx, CreateInput{Name: "Org"})
	require.NoError(t, err)

	newName := "Org Updated"
	newSlug := "org-updated"
	status := "active"
	updated, err := svc.Update(ctx, org.ID, UpdateInput{
		Name:   &newName,
		Slug:   &newSlug,
		Status: &status,
	})
	require.NoError(t, err)
	require.Equal(t, newName, updated.Name)
	require.Equal(t, newSlug, updated.Slug)

	// Archive / Activate
	require.NoError(t, svc.Archive(ctx, org.ID))
	archived, err := svc.Get(ctx, org.ID)
	require.NoError(t, err)
	require.Equal(t, "inactive", archived.Status)

	require.NoError(t, svc.Activate(ctx, org.ID))
	active, err := svc.Get(ctx, org.ID)
	require.NoError(t, err)
	require.Equal(t, "active", active.Status)
}

func TestService_List(t *testing.T) {
	svc := newTestService(t)
	ctx := context.Background()

	_, _ = svc.Create(ctx, CreateInput{Name: "Org1", Slug: "org1"})
	org2, _ := svc.Create(ctx, CreateInput{Name: "Org2", Slug: "org2"})
	require.NoError(t, svc.Archive(ctx, org2.ID))

	all, err := svc.List(ctx, "")
	require.NoError(t, err)
	require.Len(t, all, 2)

	active, err := svc.List(ctx, "active")
	require.NoError(t, err)
	require.Len(t, active, 1)

	inactive, err := svc.List(ctx, "inactive")
	require.NoError(t, err)
	require.Len(t, inactive, 1)
}

func TestService_UpdateValidation(t *testing.T) {
	svc := newTestService(t)
	ctx := context.Background()

	org, err := svc.Create(ctx, CreateInput{Name: "Org3"})
	require.NoError(t, err)

	empty := ""
	_, err = svc.Update(ctx, org.ID, UpdateInput{Slug: &empty})
	require.ErrorIs(t, err, ErrInvalidInput)
}

func TestService_NotFound(t *testing.T) {
	svc := newTestService(t)
	ctx := context.Background()
	id := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

	_, err := svc.Get(ctx, id)
	require.ErrorIs(t, err, ErrNotFound)

	err = svc.Archive(ctx, id)
	require.ErrorIs(t, err, ErrNotFound)
}
