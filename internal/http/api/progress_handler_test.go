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
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	httpmiddleware "lms-go/internal/http/middleware"
	"lms-go/internal/organization"
	"lms-go/internal/progress"
	"lms-go/internal/user"

	_ "github.com/glebarez/go-sqlite"
)

func newProgressHandlerEnv(t *testing.T) (*ProgressHandler, uuid.UUID, uuid.UUID, uuid.UUID, []uuid.UUID, func()) {
	db, err := sql.Open("sqlite", "file:progresshandler?mode=memory&cache=shared")
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

	handler := NewProgressHandler(progress.NewService(client))
	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}
	return handler, org.ID, enr.ID, crs.ID, []uuid.UUID{mod1.ID, mod2.ID}, cleanup
}

func setupProgressRouter(t *testing.T) (*chi.Mux, uuid.UUID, uuid.UUID, []uuid.UUID) {
	handler, orgID, enrollmentID, _, modules, cleanup := newProgressHandlerEnv(t)
	t.Cleanup(cleanup)
	router := chi.NewRouter()
	router.Use(httpmiddleware.TenantFromHeader)
	router.Route("/enrollments", func(cr chi.Router) {
		cr.Route("/{id}/progress", handler.Mount)
	})
	return router, orgID, enrollmentID, modules
}

func TestProgressHandler_Workflow(t *testing.T) {
	router, orgID, enrollmentID, modules := setupProgressRouter(t)

	// Start first module
	startBody, _ := json.Marshal(map[string]any{"module_id": modules[0]})
	req := httptest.NewRequest(http.MethodPost, "/enrollments/"+enrollmentID.String()+"/progress/start", bytes.NewReader(startBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Org-ID", orgID.String())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusOK, rec.Code)

	// Complete first module
	completeBody, _ := json.Marshal(map[string]any{"module_id": modules[0]})
	compReq := httptest.NewRequest(http.MethodPost, "/enrollments/"+enrollmentID.String()+"/progress/complete", bytes.NewReader(completeBody))
	compReq.Header.Set("Content-Type", "application/json")
	compReq.Header.Set("X-Org-ID", orgID.String())
	compRec := httptest.NewRecorder()
	router.ServeHTTP(compRec, compReq)
	require.Equal(t, http.StatusOK, compRec.Code)

	// List progress
	listReq := httptest.NewRequest(http.MethodGet, "/enrollments/"+enrollmentID.String()+"/progress", nil)
	listReq.Header.Set("X-Org-ID", orgID.String())
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	require.Equal(t, http.StatusOK, listRec.Code)
}
