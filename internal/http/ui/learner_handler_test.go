package ui

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/content"
	"lms-go/internal/course"
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	"lms-go/internal/organization"
	"lms-go/internal/progress"
	"lms-go/internal/user"

	_ "github.com/glebarez/go-sqlite"
)

type learnerStubStorage struct{}

func (s *learnerStubStorage) PresignUpload(_ context.Context, object string, _ string, _ time.Duration) (string, error) {
	return "https://example.com/upload/" + object, nil
}

func (s *learnerStubStorage) PresignDownload(_ context.Context, object string, _ time.Duration) (string, error) {
	return "https://cdn.example.com/" + object, nil
}

func (s *learnerStubStorage) Remove(context.Context, string) error { return nil }

type learnerTestEnv struct {
	router        *chi.Mux
	client        *ent.Client
	orgSvc        *organization.Service
	userSvc       *user.Service
	courseSvc     *course.Service
	contentSvc    *content.Service
	enrollmentSvc *enrollment.Service
	progressSvc   *progress.Service
	cleanup       func()
	backgroundCtx context.Context
	orgID         uuid.UUID
	learnerID     uuid.UUID
	courseID      uuid.UUID
	moduleIDs     []uuid.UUID
}

func newLearnerTestEnv(t *testing.T) *learnerTestEnv {
	t.Helper()

	db, err := sql.Open("sqlite", "file:learnerui?mode=memory&cache=shared")
	require.NoError(t, err)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	driver := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(driver))
	ctx := context.Background()
	require.NoError(t, client.Schema.Create(ctx))

	orgSvc := organization.NewService(client)
	userSvc := user.NewService(client)
	contentSvc := content.NewService(client, &learnerStubStorage{}, content.Config{})
	courseSvc := course.NewService(client)
	enrollmentSvc := enrollment.NewService(client)
	progressSvc := progress.NewService(client)

	handler := NewLearnerHandler(orgSvc, userSvc, courseSvc, contentSvc, enrollmentSvc, progressSvc)
	router := chi.NewRouter()
	router.Route("/learn", handler.Mount)

	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}

	env := &learnerTestEnv{
		router:        router,
		client:        client,
		orgSvc:        orgSvc,
		userSvc:       userSvc,
		courseSvc:     courseSvc,
		contentSvc:    contentSvc,
		enrollmentSvc: enrollmentSvc,
		progressSvc:   progressSvc,
		cleanup:       cleanup,
		backgroundCtx: ctx,
	}
	t.Cleanup(cleanup)
	env.seed(t)
	return env
}

func (e *learnerTestEnv) seed(t *testing.T) {
	ctx := e.backgroundCtx

	org, err := e.orgSvc.Create(ctx, organization.CreateInput{Name: "Campus", Slug: "campus"})
	require.NoError(t, err)
	e.orgID = org.ID

	learner, err := e.userSvc.Create(ctx, user.CreateInput{
		OrganizationID: org.ID,
		Email:          "learner@example.com",
		Password:       "Password!123",
		Role:           "learner",
	})
	require.NoError(t, err)
	e.learnerID = learner.ID

	upload, err := e.contentSvc.CreateUpload(ctx, content.CreateUploadInput{
		OrganizationID: org.ID,
		Name:           "Guide.pdf",
		MimeType:       "application/pdf",
	})
	require.NoError(t, err)
	_, err = e.contentSvc.Finalize(ctx, org.ID, upload.Content.ID, content.FinalizeInput{})
	require.NoError(t, err)

	courseEntity, err := e.courseSvc.Create(ctx, course.CreateCourseInput{
		OrganizationID: org.ID,
		Title:          "Onboarding Go",
		Slug:           "onboarding-go",
		Description:    "Découverte de la plateforme.",
	})
	require.NoError(t, err)
	_, err = e.courseSvc.Publish(ctx, org.ID, courseEntity.ID)
	require.NoError(t, err)
	e.courseID = courseEntity.ID

	pdfModule, err := e.courseSvc.AddModule(ctx, org.ID, courseEntity.ID, course.ModuleInput{
		Title:      "Bienvenue",
		ModuleType: "pdf",
		ContentID:  &upload.Content.ID,
	})
	require.NoError(t, err)

	videoModule, err := e.courseSvc.AddModule(ctx, org.ID, courseEntity.ID, course.ModuleInput{
		Title:      "Visite guidée",
		ModuleType: "video",
		Data: map[string]any{
			"video_url": "https://player.example.com/watch?v=demo",
		},
	})
	require.NoError(t, err)

	articleModule, err := e.courseSvc.AddModule(ctx, org.ID, courseEntity.ID, course.ModuleInput{
		Title:      "Guide pratique",
		ModuleType: "article",
		Data: map[string]any{
			"body": "## Bienvenue\nCe module vous présente les fonctionnalités clés.",
		},
	})
	require.NoError(t, err)
	e.moduleIDs = []uuid.UUID{pdfModule.ID, videoModule.ID, articleModule.ID}

	enrollmentEntity, err := e.enrollmentSvc.Enroll(ctx, enrollment.EnrollInput{
		OrganizationID: org.ID,
		CourseID:       courseEntity.ID,
		UserID:         learner.ID,
	})
	require.NoError(t, err)

	_, err = e.progressSvc.Complete(ctx, org.ID, enrollmentEntity.ID, pdfModule.ID, nil)
	require.NoError(t, err)
	_, err = e.progressSvc.Start(ctx, org.ID, enrollmentEntity.ID, videoModule.ID)
	require.NoError(t, err)
}

func TestLearnerHandler_Catalog(t *testing.T) {
	env := newLearnerTestEnv(t)

	req := httptest.NewRequest(http.MethodGet, "/learn?org="+env.orgID.String()+"&user="+env.learnerID.String(), nil)
	rec := httptest.NewRecorder()

	env.router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	require.Contains(t, body, "Catalogue des parcours")
	require.Contains(t, body, "Onboarding Go")
	require.Contains(t, body, "33% complété")
}

func TestLearnerHandler_CourseDetail(t *testing.T) {
	env := newLearnerTestEnv(t)
	moduleID := env.moduleIDs[2] // article module

	q := url.Values{}
	q.Set("org", env.orgID.String())
	q.Set("user", env.learnerID.String())
	q.Set("module", moduleID.String())
	req := httptest.NewRequest(http.MethodGet, "/learn/courses/"+env.courseID.String()+"?"+q.Encode(), nil)
	rec := httptest.NewRecorder()

	env.router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	require.Contains(t, body, "Guide pratique")
	require.Contains(t, body, "Ce module vous présente les fonctionnalités clés.")
	require.Contains(t, body, "Visite guidée")
	require.Contains(t, body, "En cours")

	// Vérifie que le module PDF propose un lien de téléchargement.
	pdfModule := env.moduleIDs[0]
	q.Set("module", pdfModule.String())
	pdfReq := httptest.NewRequest(http.MethodGet, "/learn/courses/"+env.courseID.String()+"?"+q.Encode(), nil)
	pdfRec := httptest.NewRecorder()
	env.router.ServeHTTP(pdfRec, pdfReq)
	require.Equal(t, http.StatusOK, pdfRec.Code)
	require.Contains(t, pdfRec.Body.String(), "Télécharger")
}
