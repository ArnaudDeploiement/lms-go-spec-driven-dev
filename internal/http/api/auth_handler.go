package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/auth"
)

// AuthHandler gère les endpoints d'authentification.
type AuthHandler struct {
	service *auth.Service
}

// NewAuthHandler crée un AuthHandler.
func NewAuthHandler(service *auth.Service) *AuthHandler {
	return &AuthHandler{service: service}
}

// Mount enregistre les routes d'authentification sur le routeur chi donné.
func (h *AuthHandler) Mount(r chi.Router) {
	r.Post("/register", h.handleRegister)
	r.Post("/login", h.handleLogin)
	r.Post("/refresh", h.handleRefresh)
}

type registerRequest struct {
	OrganizationID string         `json:"organization_id"`
	Email          string         `json:"email"`
	Password       string         `json:"password"`
	Role           string         `json:"role"`
	Metadata       map[string]any `json:"metadata"`
}

type authResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    string `json:"expires_at"`
}

func (h *AuthHandler) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}

	orgID, err := uuid.Parse(req.OrganizationID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "organization_id invalide")
		return
	}

	user, err := h.service.Register(r.Context(), auth.RegisterInput{
		OrganizationID: orgID,
		Email:          req.Email,
		Password:       req.Password,
		Role:           req.Role,
		Metadata:       req.Metadata,
	})
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrEmailAlreadyUsed):
			respondError(w, http.StatusConflict, "email déjà utilisé")
		case errors.Is(err, auth.ErrInvalidCredentials):
			respondError(w, http.StatusBadRequest, "données invalides")
		default:
			respondError(w, http.StatusInternalServerError, "erreur serveur")
		}
		return
	}

	respondJSON(w, http.StatusCreated, map[string]any{
		"id":              user.ID,
		"organization_id": user.OrganizationID,
		"email":           user.Email,
		"role":            user.Role,
		"status":          user.Status,
	})
}

type loginRequest struct {
	OrganizationID string `json:"organization_id"`
	Email          string `json:"email"`
	Password       string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}

	orgID, err := uuid.Parse(req.OrganizationID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "organization_id invalide")
		return
	}

	tokens, err := h.service.Login(r.Context(), orgID, req.Email, req.Password)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrInvalidCredentials):
			respondError(w, http.StatusUnauthorized, "identifiants invalides")
		case errors.Is(err, auth.ErrUserInactive):
			respondError(w, http.StatusForbidden, "compte inactif")
		default:
			respondError(w, http.StatusInternalServerError, "erreur serveur")
		}
		return
	}

	respondJSON(w, http.StatusOK, authResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt.Format(time.RFC3339),
	})
}

func (h *AuthHandler) handleRefresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}

	tokens, err := h.service.Refresh(r.Context(), req.RefreshToken)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrInvalidToken):
			respondError(w, http.StatusUnauthorized, "refresh token invalide")
		default:
			respondError(w, http.StatusInternalServerError, "erreur serveur")
		}
		return
	}

	respondJSON(w, http.StatusOK, authResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt.Format(time.RFC3339),
	})
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
