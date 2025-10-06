package api

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/auth"
	"lms-go/internal/ent"

	_ "github.com/glebarez/go-sqlite"
)

func setupAuthTest(t *testing.T) (*ent.Client, *auth.Service, uuid.UUID) {
	t.Helper()
	db, err := sql.Open("sqlite", "file:authhandler?mode=memory&cache=shared")
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

	org, err := client.Organization.Create().
		SetName("TestOrg").
		SetSlug("testorg").
		Save(ctx)
	require.NoError(t, err)

	svc := auth.NewService(client, auth.Config{
		JWTSecret:       "handler-secret",
		AccessTokenTTL:  time.Minute,
		RefreshTokenTTL: time.Hour,
	})

	return client, svc, org.ID
}

func TestAuthHandler_RegisterAndLogin(t *testing.T) {
	_, svc, orgID := setupAuthTest(t)
	handler := NewAuthHandler(svc)
	r := chi.NewRouter()
	handler.Mount(r)

	registerPayload := map[string]any{
		"organization_id": orgID.String(),
		"email":           "user@example.com",
		"password":        "supersecret",
		"role":            "admin",
	}
	body, _ := json.Marshal(registerPayload)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	loginPayload := map[string]any{
		"organization_id": orgID.String(),
		"email":           "user@example.com",
		"password":        "supersecret",
	}
	loginBody, _ := json.Marshal(loginPayload)

	loginReq := httptest.NewRequest(http.MethodPost, "/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()

	r.ServeHTTP(loginRec, loginReq)
	require.Equal(t, http.StatusOK, loginRec.Code)

	var resp map[string]string
	require.NoError(t, json.Unmarshal(loginRec.Body.Bytes(), &resp))
	require.NotEmpty(t, resp["access_token"])

	refreshPayload := map[string]string{
		"refresh_token": resp["refresh_token"],
	}
	refreshBody, _ := json.Marshal(refreshPayload)
	refreshReq := httptest.NewRequest(http.MethodPost, "/refresh", bytes.NewReader(refreshBody))
	refreshReq.Header.Set("Content-Type", "application/json")
	refreshRec := httptest.NewRecorder()

	r.ServeHTTP(refreshRec, refreshReq)
	require.Equal(t, http.StatusOK, refreshRec.Code)
}

func TestAuthHandler_InvalidPayload(t *testing.T) {
	_, svc, _ := setupAuthTest(t)
	handler := NewAuthHandler(svc)
	r := chi.NewRouter()
	handler.Mount(r)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	require.Equal(t, http.StatusBadRequest, rec.Code)

	refreshReq := httptest.NewRequest(http.MethodPost, "/refresh", bytes.NewReader([]byte(`{"refresh_token":"bad"}`)))
	refreshReq.Header.Set("Content-Type", "application/json")
	refreshRec := httptest.NewRecorder()
	r.ServeHTTP(refreshRec, refreshReq)
	require.Equal(t, http.StatusUnauthorized, refreshRec.Code)
}
