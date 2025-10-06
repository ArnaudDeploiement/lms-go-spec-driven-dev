package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/ent"
	"lms-go/internal/tenant"
	"lms-go/internal/user"
)

// UserHandler expose les endpoints CRUD liés aux utilisateurs d'une organisation.
type UserHandler struct {
	service *user.Service
}

func NewUserHandler(service *user.Service) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) Mount(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Route("/{id}", func(r chi.Router) {
		r.Get("/", h.get)
		r.Patch("/", h.update)
		r.Delete("/", h.deactivate)
		r.Post("/activate", h.activate)
	})
}

type userResponse struct {
	ID        uuid.UUID      `json:"id"`
	Email     string         `json:"email"`
	Role      string         `json:"role"`
	Status    string         `json:"status"`
	Metadata  map[string]any `json:"metadata"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

func toUserResponse(u *ent.User) userResponse {
	return userResponse{
		ID:        u.ID,
		Email:     u.Email,
		Role:      u.Role,
		Status:    u.Status,
		Metadata:  u.Metadata,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

type createUserRequest struct {
	Email    string         `json:"email"`
	Password string         `json:"password"`
	Role     string         `json:"role"`
	Status   string         `json:"status"`
	Metadata map[string]any `json:"metadata"`
}

type updateUserRequest struct {
	Email    *string        `json:"email"`
	Password *string        `json:"password"`
	Role     *string        `json:"role"`
	Status   *string        `json:"status"`
	Metadata map[string]any `json:"metadata"`
}

func (h *UserHandler) list(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	filter := user.Filter{
		Role:   r.URL.Query().Get("role"),
		Status: r.URL.Query().Get("status"),
	}
	users, err := h.service.List(r.Context(), orgID, filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "impossible de lister les utilisateurs")
		return
	}

	resp := make([]userResponse, 0, len(users))
	for _, u := range users {
		resp = append(resp, toUserResponse(u))
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *UserHandler) create(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}

	var req createUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}

	created, err := h.service.Create(r.Context(), user.CreateInput{
		OrganizationID: orgID,
		Email:          req.Email,
		Password:       req.Password,
		Role:           req.Role,
		Status:         req.Status,
		Metadata:       req.Metadata,
	})
	if err != nil {
		switch {
		case errors.Is(err, user.ErrInvalidInput):
			respondError(w, http.StatusBadRequest, "données invalides")
		case errors.Is(err, user.ErrEmailAlreadyUsed):
			respondError(w, http.StatusConflict, "email déjà utilisé")
		default:
			respondError(w, http.StatusInternalServerError, "erreur lors de la création")
		}
		return
	}

	respondJSON(w, http.StatusCreated, toUserResponse(created))
}

func (h *UserHandler) get(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	entity, err := h.service.Get(r.Context(), orgID, userID)
	if err != nil {
		if errors.Is(err, user.ErrNotFound) {
			respondError(w, http.StatusNotFound, "utilisateur introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur serveur")
		}
		return
	}

	respondJSON(w, http.StatusOK, toUserResponse(entity))
}

func (h *UserHandler) update(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	var req updateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}

	updated, err := h.service.Update(r.Context(), orgID, userID, user.UpdateInput{
		Email:    req.Email,
		Password: req.Password,
		Role:     req.Role,
		Status:   req.Status,
		Metadata: req.Metadata,
	})
	if err != nil {
		switch {
		case errors.Is(err, user.ErrInvalidInput):
			respondError(w, http.StatusBadRequest, "données invalides")
		case errors.Is(err, user.ErrEmailAlreadyUsed):
			respondError(w, http.StatusConflict, "email déjà utilisé")
		case errors.Is(err, user.ErrNotFound):
			respondError(w, http.StatusNotFound, "utilisateur introuvable")
		default:
			respondError(w, http.StatusInternalServerError, "erreur serveur")
		}
		return
	}

	respondJSON(w, http.StatusOK, toUserResponse(updated))
}

func (h *UserHandler) deactivate(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	if err := h.service.Deactivate(r.Context(), orgID, userID); err != nil {
		if errors.Is(err, user.ErrNotFound) {
			respondError(w, http.StatusNotFound, "utilisateur introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "impossible de désactiver")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *UserHandler) activate(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	if err := h.service.Activate(r.Context(), orgID, userID); err != nil {
		if errors.Is(err, user.ErrNotFound) {
			respondError(w, http.StatusNotFound, "utilisateur introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "impossible de réactiver")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
