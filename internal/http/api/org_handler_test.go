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
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/ent"
	"lms-go/internal/organization"

	_ "github.com/glebarez/go-sqlite"
)

func newOrgTestEnv(t *testing.T) (*organization.Service, func()) {
	t.Helper()

	db, err := sql.Open("sqlite", "file:orghandler?mode=memory&cache=shared")
	require.NoError(t, err)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	driver := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(driver))
	ctx := context.Background()
	require.NoError(t, client.Schema.Create(ctx))

	service := organization.NewService(client)
	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}
	return service, cleanup
}

func setupOrgRouter(t *testing.T) (*chi.Mux, *organization.Service) {
	service, cleanup := newOrgTestEnv(t)
	t.Cleanup(cleanup)

	handler := NewOrgHandler(service)
	router := chi.NewRouter()
	handler.Mount(router)
	return router, service
}

func TestOrgHandler_CreateList(t *testing.T) {
	router, _ := setupOrgRouter(t)

	body, _ := json.Marshal(map[string]any{
		"name": "Acme",
		"slug": "acme",
	})

	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	listReq := httptest.NewRequest(http.MethodGet, "/", nil)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	require.Equal(t, http.StatusOK, listRec.Code)

	var payload []map[string]any
	require.NoError(t, json.Unmarshal(listRec.Body.Bytes(), &payload))
	require.Len(t, payload, 1)
	require.Equal(t, "acme", payload[0]["slug"])
}

func TestOrgHandler_GetUpdateArchive(t *testing.T) {
	router, service := setupOrgRouter(t)
	ctx := context.Background()

	org, err := service.Create(ctx, organization.CreateInput{Name: "Org"})
	require.NoError(t, err)

	getReq := httptest.NewRequest(http.MethodGet, "/"+org.ID.String(), nil)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)
	require.Equal(t, http.StatusOK, getRec.Code)

	newName := "Org Updated"
	updateBody, _ := json.Marshal(map[string]any{"name": newName})
	updateReq := httptest.NewRequest(http.MethodPatch, "/"+org.ID.String(), bytes.NewReader(updateBody))
	updateReq.Header.Set("Content-Type", "application/json")
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)
	require.Equal(t, http.StatusOK, updateRec.Code)

	delReq := httptest.NewRequest(http.MethodDelete, "/"+org.ID.String(), nil)
	delRec := httptest.NewRecorder()
	router.ServeHTTP(delRec, delReq)
	require.Equal(t, http.StatusNoContent, delRec.Code)
}
