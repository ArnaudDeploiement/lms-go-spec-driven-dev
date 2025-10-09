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

func TestAuthHandler_Signup(t *testing.T) {
	_, svc, _ := setupAuthTest(t)
	handler := NewAuthHandler(svc)
	r := chi.NewRouter()
	handler.Mount(r)

	t.Run("successful signup creates org and admin user", func(t *testing.T) {
		signupPayload := map[string]any{
			"org_name": "New Company",
			"org_slug": "new-company",
			"email":    "admin@newcompany.com",
			"password": "SecurePass123!",
		}
		body, _ := json.Marshal(signupPayload)

		req := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)
		require.Equal(t, http.StatusCreated, rec.Code)

		var resp map[string]any
		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))

		// Vérifier la structure de la réponse
		require.Contains(t, resp, "organization")
		require.Contains(t, resp, "user")
		require.Contains(t, resp, "access_token")
		require.Contains(t, resp, "refresh_token")
		require.Contains(t, resp, "expires_at")

		org := resp["organization"].(map[string]any)
		require.Equal(t, "New Company", org["name"])
		require.Equal(t, "new-company", org["slug"])

		user := resp["user"].(map[string]any)
		require.Equal(t, "admin@newcompany.com", user["email"])
		require.Equal(t, "admin", user["role"])

		require.NotEmpty(t, resp["access_token"])
		require.NotEmpty(t, resp["refresh_token"])
	})

	t.Run("signup with cookies sets httpOnly cookies", func(t *testing.T) {
		signupPayload := map[string]any{
			"org_name": "Cookie Test Org",
			"email":    "admin@cookietest.com",
			"password": "SecurePass123!",
		}
		body, _ := json.Marshal(signupPayload)

		req := httptest.NewRequest(http.MethodPost, "/signup?use_cookies=true", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)
		require.Equal(t, http.StatusCreated, rec.Code)

		// Vérifier les cookies
		cookies := rec.Result().Cookies()
		require.Len(t, cookies, 2)

		var accessCookie, refreshCookie *http.Cookie
		for _, c := range cookies {
			if c.Name == "access_token" {
				accessCookie = c
			} else if c.Name == "refresh_token" {
				refreshCookie = c
			}
		}

		require.NotNil(t, accessCookie)
		require.NotNil(t, refreshCookie)
		require.True(t, accessCookie.HttpOnly)
		require.True(t, refreshCookie.HttpOnly)
		require.Equal(t, "/", accessCookie.Path)
		require.Equal(t, "/", refreshCookie.Path)
	})

	t.Run("duplicate org slug returns conflict", func(t *testing.T) {
		signupPayload1 := map[string]any{
			"org_name": "Duplicate Org 1",
			"org_slug": "duplicate-slug",
			"email":    "admin1@duplicate.com",
			"password": "SecurePass123!",
		}
		body1, _ := json.Marshal(signupPayload1)
		req1 := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewReader(body1))
		req1.Header.Set("Content-Type", "application/json")
		rec1 := httptest.NewRecorder()
		r.ServeHTTP(rec1, req1)
		require.Equal(t, http.StatusCreated, rec1.Code)

		// Tentative de signup avec le même slug
		signupPayload2 := map[string]any{
			"org_name": "Duplicate Org 2",
			"org_slug": "duplicate-slug",
			"email":    "admin2@duplicate.com",
			"password": "SecurePass123!",
		}
		body2, _ := json.Marshal(signupPayload2)
		req2 := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewReader(body2))
		req2.Header.Set("Content-Type", "application/json")
		rec2 := httptest.NewRecorder()
		r.ServeHTTP(rec2, req2)
		require.Equal(t, http.StatusConflict, rec2.Code)
	})

	t.Run("missing org_name returns bad request", func(t *testing.T) {
		signupPayload := map[string]any{
			"email":    "admin@missingorg.com",
			"password": "SecurePass123!",
		}
		body, _ := json.Marshal(signupPayload)

		req := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestAuthHandler_LoginWithCookies(t *testing.T) {
	_, svc, orgID := setupAuthTest(t)
	handler := NewAuthHandler(svc)
	r := chi.NewRouter()
	handler.Mount(r)

	// Créer un utilisateur
	ctx := context.Background()
	_, err := svc.Register(ctx, auth.RegisterInput{
		OrganizationID: orgID,
		Email:          "user@cookie.com",
		Password:       "password123",
		Role:           "learner",
	})
	require.NoError(t, err)

	t.Run("login with cookies enabled", func(t *testing.T) {
		loginPayload := map[string]any{
			"organization_id": orgID.String(),
			"email":           "user@cookie.com",
			"password":        "password123",
		}
		body, _ := json.Marshal(loginPayload)

		req := httptest.NewRequest(http.MethodPost, "/login?use_cookies=true", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)
		require.Equal(t, http.StatusOK, rec.Code)

		// Vérifier les cookies
		cookies := rec.Result().Cookies()
		require.Len(t, cookies, 2)
	})
}

func TestAuthHandler_RefreshWithCookie(t *testing.T) {
	_, svc, orgID := setupAuthTest(t)
	handler := NewAuthHandler(svc)
	r := chi.NewRouter()
	handler.Mount(r)

	// Créer et login un utilisateur
	ctx := context.Background()
	_, err := svc.Register(ctx, auth.RegisterInput{
		OrganizationID: orgID,
		Email:          "user@refresh.com",
		Password:       "password123",
		Role:           "learner",
	})
	require.NoError(t, err)

	tokens, err := svc.Login(ctx, orgID, "user@refresh.com", "password123")
	require.NoError(t, err)

	t.Run("refresh with token in cookie", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/refresh?use_cookies=true", bytes.NewReader([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{
			Name:  "refresh_token",
			Value: tokens.RefreshToken,
		})
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)
		require.Equal(t, http.StatusOK, rec.Code)

		// Vérifier que de nouveaux cookies sont définis
		cookies := rec.Result().Cookies()
		require.Len(t, cookies, 2)
	})

	t.Run("refresh with missing token returns bad request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/refresh", bytes.NewReader([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)
		require.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestAuthHandler_ForgotPassword(t *testing.T) {
	_, svc, _ := setupAuthTest(t)
	handler := NewAuthHandler(svc)
	r := chi.NewRouter()
	handler.Mount(r)

	t.Run("forgot password returns success for any email", func(t *testing.T) {
		payload := map[string]string{
			"email": "nonexistent@example.com",
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/forgot-password", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)
		require.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]string
		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
		require.Contains(t, resp["message"], "réinitialisation")
	})
}
