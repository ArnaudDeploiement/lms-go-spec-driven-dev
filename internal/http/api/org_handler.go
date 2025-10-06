package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/ent"
	"lms-go/internal/organization"
)

// OrgHandler gère les routes CRUD des organisations.
type OrgHandler struct {
	service *organization.Service
}

func NewOrgHandler(service *organization.Service) *OrgHandler {
	return &OrgHandler{service: service}
}

func (h *OrgHandler) Mount(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Route("/{id}", func(r chi.Router) {
		r.Get("/", h.get)
		r.Patch("/", h.update)
		r.Delete("/", h.archive)
		r.Post("/activate", h.activate)
	})
}

type orgResponse struct {
	ID        uuid.UUID      `json:"id"`
	Name      string         `json:"name"`
	Slug      string         `json:"slug"`
	Status    string         `json:"status"`
	Settings  map[string]any `json:"settings"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

func toOrgResponse(org *ent.Organization) orgResponse {
	return orgResponse{
		ID:        org.ID,
		Name:      org.Name,
		Slug:      org.Slug,
		Status:    org.Status,
		Settings:  org.Settings,
		CreatedAt: org.CreatedAt,
		UpdatedAt: org.UpdatedAt,
	}
}

type createOrgRequest struct {
    Name     string         `json:"name"`
    Slug     string         `json:"slug"`
    Settings map[string]any `json:"settings"`
}

type updateOrgRequest struct {
    Name     *string        `json:"name"`
    Slug     *string        `json:"slug"`
    Status   *string        `json:"status"`
    Settings map[string]any `json:"settings"`
}

func (h *OrgHandler) list(w http.ResponseWriter, r *http.Request) {
    status := r.URL.Query().Get("status")
    orgs, err := h.service.List(r.Context(), status)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "impossible de lister les organisations")
        return
    }

    out := make([]orgResponse, 0, len(orgs))
    for _, org := range orgs {
        out = append(out, toOrgResponse(org))
    }
    respondJSON(w, http.StatusOK, out)
}

func (h *OrgHandler) create(w http.ResponseWriter, r *http.Request) {
    var req createOrgRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "payload invalide")
        return
    }

    org, err := h.service.Create(r.Context(), organization.CreateInput{
        Name:     req.Name,
        Slug:     req.Slug,
        Settings: req.Settings,
    })
    if err != nil {
        switch {
        case errors.Is(err, organization.ErrInvalidInput):
            respondError(w, http.StatusBadRequest, "données invalides")
        case errors.Is(err, organization.ErrSlugAlreadyUsed):
            respondError(w, http.StatusConflict, "slug déjà utilisé")
        default:
            respondError(w, http.StatusInternalServerError, "erreur lors de la création")
        }
        return
    }

    respondJSON(w, http.StatusCreated, toOrgResponse(org))
}

func (h *OrgHandler) get(w http.ResponseWriter, r *http.Request) {
    id, err := uuid.Parse(chi.URLParam(r, "id"))
    if err != nil {
        respondError(w, http.StatusBadRequest, "identifiant invalide")
        return
    }

    org, err := h.service.Get(r.Context(), id)
    if err != nil {
        if errors.Is(err, organization.ErrNotFound) {
            respondError(w, http.StatusNotFound, "organisation introuvable")
        } else {
            respondError(w, http.StatusInternalServerError, "erreur serveur")
        }
        return
    }

    respondJSON(w, http.StatusOK, toOrgResponse(org))
}

func (h *OrgHandler) update(w http.ResponseWriter, r *http.Request) {
    id, err := uuid.Parse(chi.URLParam(r, "id"))
    if err != nil {
        respondError(w, http.StatusBadRequest, "identifiant invalide")
        return
    }

    var req updateOrgRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "payload invalide")
        return
    }

    org, err := h.service.Update(r.Context(), id, organization.UpdateInput{
        Name:     req.Name,
        Slug:     req.Slug,
        Status:   req.Status,
        Settings: req.Settings,
    })
    if err != nil {
        switch {
        case errors.Is(err, organization.ErrInvalidInput):
            respondError(w, http.StatusBadRequest, "données invalides")
        case errors.Is(err, organization.ErrSlugAlreadyUsed):
            respondError(w, http.StatusConflict, "slug déjà utilisé")
        case errors.Is(err, organization.ErrNotFound):
            respondError(w, http.StatusNotFound, "organisation introuvable")
        default:
            respondError(w, http.StatusInternalServerError, "erreur serveur")
        }
        return
    }

    respondJSON(w, http.StatusOK, toOrgResponse(org))
}

func (h *OrgHandler) archive(w http.ResponseWriter, r *http.Request) {
    id, err := uuid.Parse(chi.URLParam(r, "id"))
    if err != nil {
        respondError(w, http.StatusBadRequest, "identifiant invalide")
        return
    }

    if err := h.service.Archive(r.Context(), id); err != nil {
        if errors.Is(err, organization.ErrNotFound) {
            respondError(w, http.StatusNotFound, "organisation introuvable")
        } else {
            respondError(w, http.StatusInternalServerError, "impossible d'archiver")
        }
        return
    }

	w.WriteHeader(http.StatusNoContent)
}

func (h *OrgHandler) activate(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	if err := h.service.Activate(r.Context(), id); err != nil {
		if errors.Is(err, organization.ErrNotFound) {
			respondError(w, http.StatusNotFound, "organisation introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "impossible de réactiver")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
