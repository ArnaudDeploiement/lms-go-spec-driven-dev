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
	enrollmentservice "lms-go/internal/enrollment"
	"lms-go/internal/ent"
	httpmiddleware "lms-go/internal/http/middleware"
	"lms-go/internal/organization"
	"lms-go/internal/user"

	_ "github.com/glebarez/go-sqlite"
)

func newEnrollmentHandlerEnv(t *testing.T) (*EnrollmentHandler, uuid.UUID, uuid.UUID, uuid.UUID, func()) {
	db, err := sql.Open("sqlite", "file:enrollmenthandler?mode=memory&cache=shared")
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

	handler := NewEnrollmentHandler(enrollmentservice.NewService(client))
	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}
	return handler, org.ID, usr.ID, crs.ID, cleanup
}

func setupEnrollmentRouter(t *testing.T) (*chi.Mux, uuid.UUID, uuid.UUID, uuid.UUID) {
	handler, orgID, userID, courseID, cleanup := newEnrollmentHandlerEnv(t)
	t.Cleanup(cleanup)
	router := chi.NewRouter()
	router.Use(httpmiddleware.TenantFromHeader)
	router.Route("/enrollments", handler.Mount)
	return router, orgID, userID, courseID
}

func TestEnrollmentHandler_CreateAndList(t *testing.T) {
	router, orgID, userID, courseID := setupEnrollmentRouter(t)

	enrollBody, _ := json.Marshal(map[string]any{
		"course_id": courseID,
		"user_id":   userID,
	})
	req := httptest.NewRequest(http.MethodPost, "/enrollments", bytes.NewReader(enrollBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Org-ID", orgID.String())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	listReq := httptest.NewRequest(http.MethodGet, "/enrollments", nil)
	listReq.Header.Set("X-Org-ID", orgID.String())
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	require.Equal(t, http.StatusOK, listRec.Code)
}

func TestEnrollmentHandler_GroupLifecycle(t *testing.T) {
	router, orgID, userID, courseID := setupEnrollmentRouter(t)

	capacity := 1
	groupPayload := map[string]any{
		"name":      "Batch",
		"course_id": courseID,
		"capacity":  capacity,
	}
	gBody, _ := json.Marshal(groupPayload)
	gReq := httptest.NewRequest(http.MethodPost, "/enrollments/groups", bytes.NewReader(gBody))
	gReq.Header.Set("Content-Type", "application/json")
	gReq.Header.Set("X-Org-ID", orgID.String())
	gRec := httptest.NewRecorder()
	router.ServeHTTP(gRec, gReq)
	require.Equal(t, http.StatusCreated, gRec.Code)

	var groupResp map[string]any
	require.NoError(t, json.Unmarshal(gRec.Body.Bytes(), &groupResp))
	groupID := groupResp["id"].(string)

	// Enroll user into group
	enrollBody, _ := json.Marshal(map[string]any{
		"course_id": courseID,
		"user_id":   userID,
		"group_id":  groupID,
	})
	enrollReq := httptest.NewRequest(http.MethodPost, "/enrollments", bytes.NewReader(enrollBody))
	enrollReq.Header.Set("Content-Type", "application/json")
	enrollReq.Header.Set("X-Org-ID", orgID.String())
	enrollRec := httptest.NewRecorder()
	router.ServeHTTP(enrollRec, enrollReq)
	require.Equal(t, http.StatusCreated, enrollRec.Code)

	var enrollmentResp map[string]any
	require.NoError(t, json.Unmarshal(enrollRec.Body.Bytes(), &enrollmentResp))
	enrollmentID := enrollmentResp["id"].(string)

	// Update enrollment progress
	updBody, _ := json.Marshal(map[string]any{"progress": 50})
	updReq := httptest.NewRequest(http.MethodPatch, "/enrollments/"+enrollmentID, bytes.NewReader(updBody))
	updReq.Header.Set("Content-Type", "application/json")
	updReq.Header.Set("X-Org-ID", orgID.String())
	updRec := httptest.NewRecorder()
	router.ServeHTTP(updRec, updReq)
	require.Equal(t, http.StatusOK, updRec.Code)

	// Cancel enrollment
	cancelReq := httptest.NewRequest(http.MethodDelete, "/enrollments/"+enrollmentID, nil)
	cancelReq.Header.Set("X-Org-ID", orgID.String())
	cancelRec := httptest.NewRecorder()
	router.ServeHTTP(cancelRec, cancelReq)
	require.Equal(t, http.StatusNoContent, cancelRec.Code)
}
