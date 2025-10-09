package ui

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"

	"lms-go/internal/content"
	"lms-go/internal/course"
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	"lms-go/internal/organization"
	"lms-go/internal/user"

	_ "github.com/glebarez/go-sqlite"
)

type stubStorage struct{}

func (s *stubStorage) PresignUpload(_ context.Context, object string, _ string, _ time.Duration) (string, error) {
	return "https://example.com/upload/" + object, nil
}

func (s *stubStorage) PresignDownload(_ context.Context, object string, _ time.Duration) (string, error) {
	return "https://example.com/download/" + object, nil
}

func (s *stubStorage) Remove(context.Context, string) error { return nil }

type adminTestEnv struct {
	router        *chi.Mux
	client        *ent.Client
	orgSvc        *organization.Service
	userSvc       *user.Service
	courseSvc     *course.Service
	contentSvc    *content.Service
	enrollmentSvc *enrollment.Service
	cleanup       func()
	backgroundCtx context.Context
}

func newAdminTestEnv(t *testing.T) *adminTestEnv {
	t.Helper()

	db, err := sql.Open("sqlite", "file:adminui?mode=memory&cache=shared")
	require.NoError(t, err)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	driver := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(driver))
	ctx := context.Background()
	require.NoError(t, client.Schema.Create(ctx))

	orgSvc := organization.NewService(client)
	userSvc := user.NewService(client)
	contentSvc := content.NewService(client, &stubStorage{}, content.Config{})
	courseSvc := course.NewService(client)
	enrollmentSvc := enrollment.NewService(client)

	handler := NewAdminHandler(orgSvc, userSvc, courseSvc, contentSvc, enrollmentSvc)
	router := chi.NewRouter()
	router.Route("/admin", handler.Mount)

	cleanup := func() {
		_ = client.Close()
		_ = db.Close()
	}

	env := &adminTestEnv{
		router:        router,
		client:        client,
		orgSvc:        orgSvc,
		userSvc:       userSvc,
		courseSvc:     courseSvc,
		contentSvc:    contentSvc,
		enrollmentSvc: enrollmentSvc,
		cleanup:       cleanup,
		backgroundCtx: ctx,
	}
	t.Cleanup(cleanup)
	return env
}

func TestAdminHandler_DashboardRendersData(t *testing.T) {
	env := newAdminTestEnv(t)
	ctx := env.backgroundCtx

	org, err := env.orgSvc.Create(ctx, organization.CreateInput{Name: "Acme", Slug: "acme"})
	require.NoError(t, err)

	userEntity, err := env.userSvc.Create(ctx, user.CreateInput{
		OrganizationID: org.ID,
		Email:          "admin@example.com",
		Password:       "secret123",
		Role:           "admin",
	})
	require.NoError(t, err)

	upload, err := env.contentSvc.CreateUpload(ctx, content.CreateUploadInput{
		OrganizationID: org.ID,
		Name:           "Document.pdf",
		MimeType:       "application/pdf",
	})
	require.NoError(t, err)

	courseEntity, err := env.courseSvc.Create(ctx, course.CreateCourseInput{
		OrganizationID: org.ID,
		Title:          "Onboarding",
		Slug:           "onboarding",
	})
	require.NoError(t, err)

	_, err = env.courseSvc.AddModule(ctx, org.ID, courseEntity.ID, course.ModuleInput{
		Title:      "Introduction",
		ModuleType: "pdf",
		ContentID:  &upload.Content.ID,
	})
	require.NoError(t, err)

	_, err = env.enrollmentSvc.Enroll(ctx, enrollment.EnrollInput{
		OrganizationID: org.ID,
		CourseID:       courseEntity.ID,
		UserID:         userEntity.ID,
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/admin?org="+org.ID.String(), nil)
	rec := httptest.NewRecorder()
	env.router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	require.Contains(t, body, "Organisations")
	require.Contains(t, body, "Acme")
	require.Contains(t, body, "Inscriptions: 1")
	require.Contains(t, body, "Contenus médias")
	require.Contains(t, body, `label class="block text-sm font-medium text-slate-700" for="course-title"`)
}

func TestAdminHandler_FormSubmissions(t *testing.T) {
	env := newAdminTestEnv(t)
	ctx := env.backgroundCtx

	// Create organization
	form := url.Values{}
	form.Set("name", "Beta Corp")
	form.Set("slug", "beta-corp")
	req := httptest.NewRequest(http.MethodPost, "/admin/organizations", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	env.router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusSeeOther, rec.Code)

	orgs, err := env.orgSvc.List(ctx, "")
	require.NoError(t, err)
	require.Len(t, orgs, 1)
	orgID := orgs[0].ID

	// Create content upload
	contentForm := url.Values{}
	contentForm.Set("org_id", orgID.String())
	contentForm.Set("name", "Programme PDF")
	contentForm.Set("mime_type", "application/pdf")
	contentForm.Set("size_bytes", "1024")
	contentReq := httptest.NewRequest(http.MethodPost, "/admin/contents", strings.NewReader(contentForm.Encode()))
	contentReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	contentRec := httptest.NewRecorder()
	env.router.ServeHTTP(contentRec, contentReq)
	require.Equal(t, http.StatusSeeOther, contentRec.Code)

	contents, err := env.contentSvc.List(ctx, orgID)
	require.NoError(t, err)
	require.Len(t, contents, 1)
	contentID := contents[0].ID

	// Create user
	userForm := url.Values{}
	userForm.Set("org_id", orgID.String())
	userForm.Set("email", "learner@example.com")
	userForm.Set("password", "Password!123")
	userForm.Set("role", "learner")
	userReq := httptest.NewRequest(http.MethodPost, "/admin/users", strings.NewReader(userForm.Encode()))
	userReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	userRec := httptest.NewRecorder()
	env.router.ServeHTTP(userRec, userReq)
	require.Equal(t, http.StatusSeeOther, userRec.Code)

	users, err := env.userSvc.List(ctx, orgID, user.Filter{})
	require.NoError(t, err)
	require.Len(t, users, 1)

	// Create course
	courseForm := url.Values{}
	courseForm.Set("org_id", orgID.String())
	courseForm.Set("title", "Parcours Go")
	courseForm.Set("slug", "parcours-go")
	courseForm.Set("description", "Découverte de Go")
	courseReq := httptest.NewRequest(http.MethodPost, "/admin/courses", strings.NewReader(courseForm.Encode()))
	courseReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	courseRec := httptest.NewRecorder()
	env.router.ServeHTTP(courseRec, courseReq)
	require.Equal(t, http.StatusSeeOther, courseRec.Code)

	courses, err := env.courseSvc.List(ctx, orgID, course.CourseFilter{})
	require.NoError(t, err)
	require.Len(t, courses, 1)
	courseID := courses[0].ID

	// Create module linked to content
	moduleForm := url.Values{}
	moduleForm.Set("org_id", orgID.String())
	moduleForm.Set("course_id", courseID.String())
	moduleForm.Set("title", "Support PDF")
	moduleForm.Set("module_type", "pdf")
	moduleForm.Set("content_id", contentID.String())
	moduleForm.Set("duration", "900")
	moduleReq := httptest.NewRequest(http.MethodPost, "/admin/modules", strings.NewReader(moduleForm.Encode()))
	moduleReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	moduleRec := httptest.NewRecorder()
	env.router.ServeHTTP(moduleRec, moduleReq)
	require.Equal(t, http.StatusSeeOther, moduleRec.Code)

	modules, err := env.courseSvc.ListModules(ctx, orgID, courseID)
	require.NoError(t, err)
	require.Len(t, modules, 1)
	require.Equal(t, 900, modules[0].DurationSeconds)
	require.NotNil(t, modules[0].ContentID)
	require.Equal(t, contentID, *modules[0].ContentID)
}

func TestAdminHandler_InvalidModuleShowsFriendlyError(t *testing.T) {
	env := newAdminTestEnv(t)
	ctx := env.backgroundCtx

	org, err := env.orgSvc.Create(ctx, organization.CreateInput{Name: "Gamma", Slug: "gamma"})
	require.NoError(t, err)

	courseEntity, err := env.courseSvc.Create(ctx, course.CreateCourseInput{
		OrganizationID: org.ID,
		Title:          "Programme",
		Slug:           "programme",
	})
	require.NoError(t, err)

	form := url.Values{}
	form.Set("org_id", org.ID.String())
	form.Set("course_id", courseEntity.ID.String())
	form.Set("title", "Module invalide")
	form.Set("module_type", "unknown")
	req := httptest.NewRequest(http.MethodPost, "/admin/modules", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	env.router.ServeHTTP(rec, req)
	require.Equal(t, http.StatusSeeOther, rec.Code)

	location := rec.Header().Get("Location")
	require.NotEmpty(t, location)
	u, err := url.Parse(location)
	require.NoError(t, err)
	require.Equal(t, "/admin", u.Path)
	require.Equal(t, "Les informations du cours ou du module sont invalides.", u.Query().Get("err"))
}
