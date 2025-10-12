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

	"lms-go/internal/course"
	"lms-go/internal/ent"
	httpmiddleware "lms-go/internal/http/middleware"
	"lms-go/internal/organization"

	_ "github.com/glebarez/go-sqlite"
)

func newCourseHandler(t *testing.T) (*CourseHandler, uuid.UUID, func()) {
	db, err := sql.Open("sqlite", "file:coursehandler?mode=memory&cache=shared")
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

	handler := NewCourseHandler(course.NewService(client))
	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}
	return handler, org.ID, cleanup
}

func setupCourseRouter(t *testing.T) (*chi.Mux, uuid.UUID) {
	handler, orgID, cleanup := newCourseHandler(t)
	t.Cleanup(cleanup)
	r := chi.NewRouter()
	r.Use(httpmiddleware.TenantFromHeader)
	handler.Mount(r)
	return r, orgID
}

func reqOrg(method, target string, orgID uuid.UUID, body []byte) *http.Request {
	req := httptest.NewRequest(method, target, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Org-ID", orgID.String())
	return req
}

func TestCourseHandler_CreateAndList(t *testing.T) {
	router, orgID := setupCourseRouter(t)

	payload := map[string]any{"title": "Intro", "slug": "intro"}
	body, _ := json.Marshal(payload)
	req := reqOrg(http.MethodPost, "/", orgID, body)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	listReq := reqOrg(http.MethodGet, "/", orgID, nil)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	require.Equal(t, http.StatusOK, listRec.Code)
}

func TestCourseHandler_Modules(t *testing.T) {
	router, orgID := setupCourseRouter(t)

	createBody, _ := json.Marshal(map[string]any{"title": "Security", "slug": "security"})
	createReq := reqOrg(http.MethodPost, "/", orgID, createBody)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)
	require.Equal(t, http.StatusCreated, createRec.Code)

	var created courseResponse
	require.NoError(t, json.Unmarshal(createRec.Body.Bytes(), &created))

	moduleBody, _ := json.Marshal(map[string]any{"title": "Intro", "module_type": "article"})
	modReq := reqOrg(http.MethodPost, "/"+created.ID.String()+"/modules", orgID, moduleBody)
	modRec := httptest.NewRecorder()
	router.ServeHTTP(modRec, modReq)
	require.Equal(t, http.StatusCreated, modRec.Code)

	var mod moduleResponse
	require.NoError(t, json.Unmarshal(modRec.Body.Bytes(), &mod))

	listReq := reqOrg(http.MethodGet, "/"+created.ID.String()+"/modules", orgID, nil)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	require.Equal(t, http.StatusOK, listRec.Code)

	courseReq := reqOrg(http.MethodGet, "/"+created.ID.String(), orgID, nil)
	courseRec := httptest.NewRecorder()
	router.ServeHTTP(courseRec, courseReq)
	require.Equal(t, http.StatusOK, courseRec.Code)

	var coursePayload courseResponse
	require.NoError(t, json.Unmarshal(courseRec.Body.Bytes(), &coursePayload))
	require.Len(t, coursePayload.Modules, 1)
	require.Equal(t, mod.ID, coursePayload.Modules[0].ID)
	require.Equal(t, 0, coursePayload.Modules[0].OrderIndex)

	reorderBody, _ := json.Marshal(map[string]any{"module_ids": []uuid.UUID{mod.ID}})
	reorderReq := reqOrg(http.MethodPost, "/"+created.ID.String()+"/modules/reorder", orgID, reorderBody)
	reorderRec := httptest.NewRecorder()
	router.ServeHTTP(reorderRec, reorderReq)
	require.Equal(t, http.StatusNoContent, reorderRec.Code)
}

func TestCourseHandler_DeletePermanent(t *testing.T) {
	router, orgID := setupCourseRouter(t)

	createBody, _ := json.Marshal(map[string]any{"title": "Legacy", "slug": "legacy"})
	createReq := reqOrg(http.MethodPost, "/", orgID, createBody)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)
	require.Equal(t, http.StatusCreated, createRec.Code)

	var created courseResponse
	require.NoError(t, json.Unmarshal(createRec.Body.Bytes(), &created))

	deleteReq := reqOrg(http.MethodDelete, "/"+created.ID.String()+"/hard", orgID, nil)
	deleteRec := httptest.NewRecorder()
	router.ServeHTTP(deleteRec, deleteReq)
	require.Equal(t, http.StatusNoContent, deleteRec.Code)

	getReq := reqOrg(http.MethodGet, "/"+created.ID.String(), orgID, nil)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)
	require.Equal(t, http.StatusNotFound, getRec.Code)
}
