package auth

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/ent"

	_ "github.com/glebarez/go-sqlite"
)

func newTestClient(t *testing.T) *ent.Client {
	t.Helper()
	db, err := sql.Open("sqlite", "file:auth?mode=memory&cache=shared")
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
	return client
}

func TestService_RegisterLoginRefresh(t *testing.T) {
	client := newTestClient(t)
	ctx := context.Background()

	org, err := client.Organization.Create().
		SetName("Acme Corp").
		SetSlug("acme").
		Save(ctx)
	require.NoError(t, err)

	svc := NewService(client, Config{
		JWTSecret:       "test-secret",
		AccessTokenTTL:  time.Minute,
		RefreshTokenTTL: time.Hour,
	})
	fixedNow := time.Date(2024, 10, 6, 12, 0, 0, 0, time.UTC)
	svc.withNow(func() time.Time { return fixedNow })

	user, err := svc.Register(ctx, RegisterInput{
		OrganizationID: org.ID,
		Email:          "Admin@Example.com",
		Password:       "supersecret",
		Role:           "admin",
	})
	require.NoError(t, err)
	require.NotNil(t, user)
	require.NotEqual(t, "supersecret", user.PasswordHash)

	tokens, err := svc.Login(ctx, "admin@example.com", "supersecret")
	require.NoError(t, err)
	require.NotEmpty(t, tokens.AccessToken)
	require.NotEmpty(t, tokens.RefreshToken)
	require.Equal(t, fixedNow.Add(time.Minute), tokens.ExpiresAt)

	claims, err := svc.tokens.ParseClaims(tokens.AccessToken)
	require.NoError(t, err)
	require.Equal(t, user.ID.String(), claims.Subject)
	require.Equal(t, org.ID.String(), claims.OrganizationID)
	require.Equal(t, "access", claims.TokenType)

	// Refresh should issue a new pair and rotate refresh token ID.
	refreshed, err := svc.Refresh(ctx, tokens.RefreshToken)
	require.NoError(t, err)
	require.NotEqual(t, tokens.RefreshToken, refreshed.RefreshToken)

	// Invalid refresh token
	_, err = svc.Refresh(ctx, "invalid")
	require.ErrorIs(t, err, ErrInvalidToken)

	// Wrong password should fail
	_, err = svc.Login(ctx, "admin@example.com", "wrong")
	require.ErrorIs(t, err, ErrInvalidCredentials)

	// Duplicate register should fail
	_, err = svc.Register(ctx, RegisterInput{
		OrganizationID: org.ID,
		Email:          "admin@example.com",
		Password:       "anotherpass",
	})
	require.ErrorIs(t, err, ErrEmailAlreadyUsed)
}

func TestService_LoginAmbiguousIdentity(t *testing.T) {
	client := newTestClient(t)
	ctx := context.Background()

	org1, err := client.Organization.Create().
		SetName("Org1").
		SetSlug("org1").
		Save(ctx)
	require.NoError(t, err)

	org2, err := client.Organization.Create().
		SetName("Org2").
		SetSlug("org2").
		Save(ctx)
	require.NoError(t, err)

	svc := NewService(client, Config{
		JWTSecret:       "test-secret",
		AccessTokenTTL:  time.Minute,
		RefreshTokenTTL: time.Hour,
	})

	for _, org := range []struct {
		id   uuid.UUID
		role string
	}{{org1.ID, "admin"}, {org2.ID, "learner"}} {
		_, err = svc.Register(ctx, RegisterInput{
			OrganizationID: org.id,
			Email:          "shared@example.com",
			Password:       "supersecret",
			Role:           org.role,
		})
		require.NoError(t, err)
	}

	_, err = svc.Login(ctx, "shared@example.com", "supersecret")
	require.ErrorIs(t, err, ErrAmbiguousIdentity)
}

func TestService_ClearRefreshToken(t *testing.T) {
	client := newTestClient(t)
	ctx := context.Background()

	org, err := client.Organization.Create().
		SetName("Org").
		SetSlug("org").
		Save(ctx)
	require.NoError(t, err)

	user, err := client.User.Create().
		SetOrganizationID(org.ID).
		SetEmail("user@example.com").
		SetPasswordHash("hash").
		SetRole("learner").
		SetRefreshTokenID(uuid.NewString()).
		Save(ctx)
	require.NoError(t, err)

	svc := NewService(client, Config{
		JWTSecret:       "secret",
		AccessTokenTTL:  time.Minute,
		RefreshTokenTTL: time.Hour,
	})

	require.NoError(t, svc.ClearRefreshToken(ctx, user.ID))

	updated, err := client.User.Get(ctx, user.ID)
	require.NoError(t, err)
	require.Nil(t, updated.RefreshTokenID)
}
