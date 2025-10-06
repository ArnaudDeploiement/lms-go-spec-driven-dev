package api

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/ent"
	httpmiddleware "lms-go/internal/http/middleware"
	"lms-go/internal/organization"
	"lms-go/internal/user"

	_ "github.com/glebarez/go-sqlite"
)

func newUserHandlerEnv(t *testing.T) (*organization.Service, *user.Service, uuid.UUID, func()) {
	t.Helper()
	db, err := sql.Open("sqlite", "file:userhandler?mode=memory&cache=shared")
	require.NoError(t, err)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	driver := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(driver))
	ctx := context.Background()
	require.NoError(t, client.Schema.Create(ctx))

	orgSvc := organization.NewService(client)
	userSvc := user.NewService(client)
	org, err := orgSvc.Create(ctx, organization.CreateInput{Name: "Acme", Slug: "acme"})
	require.NoError(t, err)

	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}

	return orgSvc, userSvc, org.ID, cleanup
}

func setupUserRouter(t *testing.T) (*chi.Mux, uuid.UUID) {
	_, userSvc, orgID, cleanup := newUserHandlerEnv(t)
	t.Cleanup(cleanup)

	handler := NewUserHandler(userSvc)
	router := chi.NewRouter()
	router.Use(httpmiddleware.TenantFromHeader)
	handler.Mount(router)
	return router, orgID
}

func requestWithOrg(method, target string, orgID uuid.UUID, body []byte) *http.Request {
	req := httptest.NewRequest(method, target, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Org-ID", orgID.String())
	return req
}

func TestUserHandler_CreateList(t *testing.T) {
	router, orgID := setupUserRouter(t)

	payload := map[string]any{
		"email":    "admin@example.com",
		"password": "supersecret",
		"role":     "admin",
	}
	body, _ := json.Marshal(payload)

	req := requestWithOrg(http.MethodPost, "/", orgID, body)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	listReq := requestWithOrg(http.MethodGet, "/", orgID, nil)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	require.Equal(t, http.StatusOK, listRec.Code)

	var resp []map[string]any
	require.NoError(t, json.Unmarshal(listRec.Body.Bytes(), &resp))
	require.Len(t, resp, 1)
}

func TestUserHandler_UpdateLifecycle(t *testing.T) {
	router, orgID := setupUserRouter(t)
	createBody, _ := json.Marshal(map[string]any{
		"email":    "user@example.com",
		"password": "supersecret",
	})
	createReq := requestWithOrg(http.MethodPost, "/", orgID, createBody)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)
	require.Equal(t, http.StatusCreated, createRec.Code)

	var created map[string]any
	require.NoError(t, json.Unmarshal(createRec.Body.Bytes(), &created))
	userID := created["id"].(string)

	updateBody, _ := json.Marshal(map[string]any{"role": "tutor"})
	updateReq := requestWithOrg(http.MethodPatch, "/"+userID, orgID, updateBody)
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)
	require.Equal(t, http.StatusOK, updateRec.Code)

	deactivateReq := requestWithOrg(http.MethodDelete, "/"+userID, orgID, nil)
	deactivateRec := httptest.NewRecorder()
	router.ServeHTTP(deactivateRec, deactivateReq)
	require.Equal(t, http.StatusNoContent, deactivateRec.Code)

	activateReq := requestWithOrg(http.MethodPost, "/"+userID+"/activate", orgID, nil)
	activateRec := httptest.NewRecorder()
	router.ServeHTTP(activateRec, activateReq)
	require.Equal(t, http.StatusNoContent, activateRec.Code)
}
