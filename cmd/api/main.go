package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"lms-go/internal/app/config"
	"lms-go/internal/auth"
	"lms-go/internal/content"
	"lms-go/internal/course"
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	httpapi "lms-go/internal/http/api"
	httpmiddleware "lms-go/internal/http/middleware"
	"lms-go/internal/http/ui"
	"lms-go/internal/organization"
	"lms-go/internal/platform/database"
	"lms-go/internal/platform/storage"
	"lms-go/internal/progress"
	"lms-go/internal/user"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("api: load config: %v", err)
	}

	dbClient, err := database.NewClient(ctx, database.Config{URL: cfg.DatabaseURL})
	if err != nil {
		log.Fatalf("api: db connection: %v", err)
	}
	defer func() {
		if err := dbClient.Close(); err != nil {
			log.Printf("api: closing db: %v", err)
		}
	}()

	if err := database.Migrate(ctx, dbClient); err != nil {
		log.Fatalf("api: migrate: %v", err)
	}

	storageClient, err := storage.NewMinioClient(ctx, storage.Config{
		Endpoint:  cfg.StorageEndpoint,
		AccessKey: cfg.StorageAccessKey,
		SecretKey: cfg.StorageSecretKey,
		Bucket:    cfg.StorageBucket,
		UseSSL:    cfg.StorageUseSSL,
	})
	if err != nil {
		log.Fatalf("api: storage init: %v", err)
	}

	orgService := organization.NewService(dbClient)

	authService := auth.NewService(dbClient, auth.Config{
		JWTSecret:       cfg.JWTSecret,
		AccessTokenTTL:  cfg.AccessTokenTTL,
		RefreshTokenTTL: cfg.RefreshTokenTTL,
	})

	userService := user.NewService(dbClient)
	contentService := content.NewService(dbClient, storageClient, content.Config{})
	courseService := course.NewService(dbClient)
	enrollmentService := enrollment.NewService(dbClient)
	progressService := progress.NewService(dbClient)

	router := newRouter(dbClient, orgService, userService, contentService, courseService, enrollmentService, progressService, authService)
	server := &http.Server{
		Addr:              cfg.APIAddr,
		Handler:           router,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
	}

	go func() {
		log.Printf("api: listening on %s", cfg.APIAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("api: server error: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()
	log.Println("api: shutting down gracefully")

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("api: shutdown error: %v", err)
	}
}

func newRouter(client *ent.Client, orgService *organization.Service, userService *user.Service, contentService *content.Service, courseService *course.Service, enrollmentService *enrollment.Service, progressService *progress.Service, authService *auth.Service) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// ---------- CORS ----------
	// IMPORTANT :
	// - Avec credentials (cookies), pas de wildcard '*'.
	// - En dev, autorise explicitement le front (3000).
	// - En prod, configure ALLOWED_ORIGINS="https://app.mondomaine.com,https://admin.mondomaine.com"
	allowed := []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	if env := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS")); env != "" {
		parts := strings.Split(env, ",")
		allowed = allowed[:0]
		for _, p := range parts {
			if v := strings.TrimSpace(p); v != "" {
				allowed = append(allowed, v)
			}
		}
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowed,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Org-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true, // tu utilises des cookies
		MaxAge:           300,
	}))

	// ---------- Routes ----------
	r.Handle("/static/*", http.StripPrefix("/static/", ui.StaticHandler()))
	r.Get("/", ui.HomeHandler())
	r.Get("/healthz", healthHandler)
	r.Get("/readyz", readinessHandler(client))

	authHandler := httpapi.NewAuthHandler(authService)
	r.Route("/auth", authHandler.Mount)

	orgHandler := httpapi.NewOrgHandler(orgService)
	r.Route("/orgs", orgHandler.Mount)

	userHandler := httpapi.NewUserHandler(userService)
	r.Route("/users", func(cr chi.Router) {
		cr.Use(httpmiddleware.TenantFromHeader)
		userHandler.Mount(cr)
	})

	contentHandler := httpapi.NewContentHandler(contentService)
	r.Route("/contents", func(cr chi.Router) {
		cr.Use(httpmiddleware.TenantFromHeader)
		contentHandler.Mount(cr)
	})

	courseHandler := httpapi.NewCourseHandler(courseService)
	r.Route("/courses", func(cr chi.Router) {
		cr.Use(httpmiddleware.TenantFromHeader)
		courseHandler.Mount(cr)
	})

	enrollmentHandler := httpapi.NewEnrollmentHandler(enrollmentService)
	r.Route("/enrollments", func(cr chi.Router) {
		cr.Use(httpmiddleware.TenantFromHeader)
		enrollmentHandler.Mount(cr)
		progressHandler := httpapi.NewProgressHandler(progressService)
		cr.Route("/{id}/progress", func(pr chi.Router) {
			progressHandler.Mount(pr)
		})
	})

	learnerHandler := ui.NewLearnerHandler(orgService, userService, courseService, contentService, enrollmentService, progressService)
	r.Route("/learn", learnerHandler.Mount)

	adminHandler := ui.NewAdminHandler(orgService, userService, courseService, contentService, enrollmentService)
	r.Route("/admin", adminHandler.Mount)

	return r
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func readinessHandler(client *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if _, err := client.Organization.Query().Count(ctx); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "unavailable",
				"error":  err.Error(),
			})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("api: write json error: %v", err)
	}
}
