package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/progress"
	"lms-go/internal/tenant"
)

type ProgressHandler struct {
	service *progress.Service
}

func NewProgressHandler(service *progress.Service) *ProgressHandler {
	return &ProgressHandler{service: service}
}

func (h *ProgressHandler) Mount(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/start", h.start)
	r.Post("/complete", h.complete)
}

type progressResponse struct {
	ModuleID    uuid.UUID  `json:"module_id"`
	Title       string     `json:"title"`
	ModuleType  string     `json:"module_type"`
	Position    int        `json:"position"`
	Status      string     `json:"status"`
	Score       float32    `json:"score"`
	Attempts    int        `json:"attempts"`
	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

func toProgressResponse(state progress.ModuleState) progressResponse {
	resp := progressResponse{
		ModuleID:   state.Module.ID,
		Title:      state.Module.Title,
		ModuleType: state.Module.ModuleType,
		Position:   state.Module.Position,
		Status:     progress.StatusNotStarted,
	}
	if state.Progress != nil {
		resp.Status = state.Progress.Status
		resp.Score = state.Progress.Score
		resp.Attempts = state.Progress.Attempts
		resp.StartedAt = state.Progress.StartedAt
		resp.CompletedAt = state.Progress.CompletedAt
	}
	return resp
}

func (h *ProgressHandler) list(w http.ResponseWriter, r *http.Request) {
	orgID, enrollmentID, ok := h.parseIDs(w, r)
	if !ok {
		return
	}
	states, err := h.service.Get(r.Context(), orgID, enrollmentID)
	if err != nil {
		if errors.Is(err, progress.ErrNotFound) {
			respondError(w, http.StatusNotFound, "inscription introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "impossible de récupérer la progression")
		}
		return
	}
	resp := make([]progressResponse, 0, len(states))
	for _, st := range states {
		resp = append(resp, toProgressResponse(st))
	}
	respondJSON(w, http.StatusOK, resp)
}

type progressRequest struct {
	ModuleID uuid.UUID `json:"module_id"`
	Score    *float32  `json:"score"`
}

func (h *ProgressHandler) start(w http.ResponseWriter, r *http.Request) {
	orgID, enrollmentID, ok := h.parseIDs(w, r)
	if !ok {
		return
	}
	var req progressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	entity, err := h.service.Start(r.Context(), orgID, enrollmentID, req.ModuleID)
	if err != nil {
		switch {
		case errors.Is(err, progress.ErrNotFound):
			respondError(w, http.StatusNotFound, "module ou inscription introuvable")
		case errors.Is(err, progress.ErrBlocked):
			respondError(w, http.StatusConflict, "modules précédents non complétés")
		case errors.Is(err, progress.ErrInvalidInput):
			respondError(w, http.StatusBadRequest, "données invalides")
		default:
			respondError(w, http.StatusInternalServerError, "erreur progression")
		}
		return
	}
	respondJSON(w, http.StatusOK, entity)
}

func (h *ProgressHandler) complete(w http.ResponseWriter, r *http.Request) {
	orgID, enrollmentID, ok := h.parseIDs(w, r)
	if !ok {
		return
	}
	var req progressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	entity, err := h.service.Complete(r.Context(), orgID, enrollmentID, req.ModuleID, req.Score)
	if err != nil {
		switch {
		case errors.Is(err, progress.ErrNotFound):
			respondError(w, http.StatusNotFound, "module ou inscription introuvable")
		case errors.Is(err, progress.ErrBlocked):
			respondError(w, http.StatusConflict, "modules précédents non complétés")
		case errors.Is(err, progress.ErrInvalidInput):
			respondError(w, http.StatusBadRequest, "données invalides")
		default:
			respondError(w, http.StatusInternalServerError, "erreur progression")
		}
		return
	}
	respondJSON(w, http.StatusOK, entity)
}

func (h *ProgressHandler) parseIDs(w http.ResponseWriter, r *http.Request) (uuid.UUID, uuid.UUID, bool) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return uuid.Nil, uuid.Nil, false
	}
	enrollmentID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return uuid.Nil, uuid.Nil, false
	}
	return orgID, enrollmentID, true
}
