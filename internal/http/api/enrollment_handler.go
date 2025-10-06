package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	"lms-go/internal/tenant"
)

type EnrollmentHandler struct {
	service *enrollment.Service
}

func NewEnrollmentHandler(service *enrollment.Service) *EnrollmentHandler {
	return &EnrollmentHandler{service: service}
}

func (h *EnrollmentHandler) Mount(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Route("/{id}", func(r chi.Router) {
		r.Patch("/", h.update)
		r.Delete("/", h.cancel)
	})
	r.Route("/groups", func(r chi.Router) {
		r.Get("/", h.listGroups)
		r.Post("/", h.createGroup)
	})
	r.Route("/groups/{groupId}", func(r chi.Router) {
		r.Patch("/", h.updateGroup)
		r.Delete("/", h.deleteGroup)
	})
}

type enrollRequest struct {
	CourseID uuid.UUID      `json:"course_id"`
	UserID   uuid.UUID      `json:"user_id"`
	GroupID  *uuid.UUID     `json:"group_id"`
	Metadata map[string]any `json:"metadata"`
}

func (h *EnrollmentHandler) create(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	var req enrollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	entity, err := h.service.Enroll(r.Context(), enrollment.EnrollInput{
		OrganizationID: orgID,
		CourseID:       req.CourseID,
		UserID:         req.UserID,
		GroupID:        req.GroupID,
		Metadata:       req.Metadata,
	})
	if err != nil {
		switch {
		case errors.Is(err, enrollment.ErrInvalidInput):
			respondError(w, http.StatusBadRequest, "données invalides")
		case errors.Is(err, enrollment.ErrAlreadyEnrolled):
			respondError(w, http.StatusConflict, "utilisateur déjà inscrit")
		default:
			respondError(w, http.StatusInternalServerError, "erreur inscription")
		}
		return
	}
	respondJSON(w, http.StatusCreated, toEnrollmentResponse(entity))
}

func (h *EnrollmentHandler) list(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	filter := enrollment.EnrollmentFilter{}
	if val := r.URL.Query().Get("course_id"); val != "" {
		if id, err := uuid.Parse(val); err == nil {
			filter.CourseID = id
		}
	}
	if val := r.URL.Query().Get("user_id"); val != "" {
		if id, err := uuid.Parse(val); err == nil {
			filter.UserID = id
		}
	}
	if val := r.URL.Query().Get("group_id"); val != "" {
		if id, err := uuid.Parse(val); err == nil {
			filter.GroupID = id
		}
	}
	filter.Status = r.URL.Query().Get("status")

	enrollments, err := h.service.List(r.Context(), orgID, filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "impossible de lister les inscriptions")
		return
	}
	resp := make([]enrollmentResponse, 0, len(enrollments))
	for _, e := range enrollments {
		resp = append(resp, toEnrollmentResponse(e))
	}
	respondJSON(w, http.StatusOK, resp)
}

type updateEnrollmentRequest struct {
	Status      *string        `json:"status"`
	Progress    *float32       `json:"progress"`
	Metadata    map[string]any `json:"metadata"`
	GroupID     *uuid.UUID     `json:"group_id"`
	StartedAt   *time.Time     `json:"started_at"`
	CompletedAt *time.Time     `json:"completed_at"`
}

func (h *EnrollmentHandler) update(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	enrollmentID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}
	var req updateEnrollmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	entity, err := h.service.Update(r.Context(), orgID, enrollmentID, enrollment.UpdateInput{
		Status:      req.Status,
		Progress:    req.Progress,
		Metadata:    req.Metadata,
		GroupID:     req.GroupID,
		StartedAt:   req.StartedAt,
		CompletedAt: req.CompletedAt,
	})
	if err != nil {
		if errors.Is(err, enrollment.ErrInvalidInput) {
			respondError(w, http.StatusBadRequest, "données invalides")
		} else if errors.Is(err, enrollment.ErrNotFound) {
			respondError(w, http.StatusNotFound, "inscription introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur mise à jour")
		}
		return
	}
	respondJSON(w, http.StatusOK, toEnrollmentResponse(entity))
}

func (h *EnrollmentHandler) cancel(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	enrollmentID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}
	if err := h.service.Cancel(r.Context(), orgID, enrollmentID); err != nil {
		if errors.Is(err, enrollment.ErrNotFound) {
			respondError(w, http.StatusNotFound, "inscription introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "annulation impossible")
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type groupResponse struct {
	ID          uuid.UUID      `json:"id"`
	CourseID    *uuid.UUID     `json:"course_id,omitempty"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Capacity    *int           `json:"capacity,omitempty"`
	Metadata    map[string]any `json:"metadata"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

func toGroupResponse(g *ent.Group) groupResponse {
	return groupResponse{
		ID:          g.ID,
		CourseID:    g.CourseID,
		Name:        g.Name,
		Description: g.Description,
		Capacity:    g.Capacity,
		Metadata:    g.Metadata,
		CreatedAt:   g.CreatedAt,
		UpdatedAt:   g.UpdatedAt,
	}
}

type createGroupRequest struct {
	CourseID    *uuid.UUID     `json:"course_id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Capacity    *int           `json:"capacity"`
	Metadata    map[string]any `json:"metadata"`
}

func (h *EnrollmentHandler) createGroup(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	var req createGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	entity, err := h.service.CreateGroup(r.Context(), enrollment.CreateGroupInput{
		OrganizationID: orgID,
		CourseID:       req.CourseID,
		Name:           req.Name,
		Description:    req.Description,
		Capacity:       req.Capacity,
		Metadata:       req.Metadata,
	})
	if err != nil {
		if errors.Is(err, enrollment.ErrInvalidInput) {
			respondError(w, http.StatusBadRequest, "données invalides")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur création groupe")
		}
		return
	}
	respondJSON(w, http.StatusCreated, toGroupResponse(entity))
}

func (h *EnrollmentHandler) listGroups(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	filter := enrollment.GroupFilter{}
	if val := r.URL.Query().Get("course_id"); val != "" {
		if id, err := uuid.Parse(val); err == nil {
			filter.CourseID = id
		}
	}
	groups, err := h.service.ListGroups(r.Context(), orgID, filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "impossible de lister les groupes")
		return
	}
	resp := make([]groupResponse, 0, len(groups))
	for _, g := range groups {
		resp = append(resp, toGroupResponse(g))
	}
	respondJSON(w, http.StatusOK, resp)
}

type updateGroupRequest struct {
	Name        *string        `json:"name"`
	Description *string        `json:"description"`
	Capacity    *int           `json:"capacity"`
	Metadata    map[string]any `json:"metadata"`
}

func (h *EnrollmentHandler) updateGroup(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	groupID, err := uuid.Parse(chi.URLParam(r, "groupId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}
	var req updateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	entity, err := h.service.UpdateGroup(r.Context(), orgID, groupID, enrollment.UpdateGroupInput{
		Name:        req.Name,
		Description: req.Description,
		Capacity:    req.Capacity,
		Metadata:    req.Metadata,
	})
	if err != nil {
		if errors.Is(err, enrollment.ErrInvalidInput) {
			respondError(w, http.StatusBadRequest, "données invalides")
		} else if errors.Is(err, enrollment.ErrNotFound) {
			respondError(w, http.StatusNotFound, "groupe introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur mise à jour groupe")
		}
		return
	}
	respondJSON(w, http.StatusOK, toGroupResponse(entity))
}

func (h *EnrollmentHandler) deleteGroup(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	groupID, err := uuid.Parse(chi.URLParam(r, "groupId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}
	if err := h.service.DeleteGroup(r.Context(), orgID, groupID); err != nil {
		if errors.Is(err, enrollment.ErrNotFound) {
			respondError(w, http.StatusNotFound, "groupe introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "suppression impossible")
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type enrollmentResponse struct {
	ID          uuid.UUID      `json:"id"`
	CourseID    uuid.UUID      `json:"course_id"`
	UserID      uuid.UUID      `json:"user_id"`
	GroupID     *uuid.UUID     `json:"group_id,omitempty"`
	Status      string         `json:"status"`
	Progress    float32        `json:"progress"`
	Metadata    map[string]any `json:"metadata"`
	StartedAt   *time.Time     `json:"started_at,omitempty"`
	CompletedAt *time.Time     `json:"completed_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

func toEnrollmentResponse(e *ent.Enrollment) enrollmentResponse {
	return enrollmentResponse{
		ID:          e.ID,
		CourseID:    e.CourseID,
		UserID:      e.UserID,
		GroupID:     e.GroupID,
		Status:      e.Status,
		Progress:    e.Progress,
		Metadata:    e.Metadata,
		StartedAt:   e.StartedAt,
		CompletedAt: e.CompletedAt,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}
