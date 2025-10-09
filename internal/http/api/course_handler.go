package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/course"
	"lms-go/internal/ent"
	"lms-go/internal/tenant"
)

type CourseHandler struct {
	service *course.Service
}

func NewCourseHandler(service *course.Service) *CourseHandler {
	return &CourseHandler{service: service}
}

func (h *CourseHandler) Mount(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Route("/{id}", func(r chi.Router) {
		r.Get("/", h.get)
		r.Patch("/", h.update)
		r.Delete("/", h.archive)
		r.Post("/publish", h.publish)
		r.Post("/unpublish", h.unpublish)
		r.Route("/modules", func(r chi.Router) {
			r.Get("/", h.listModules)
			r.Post("/", h.addModule)
		})
		r.Post("/modules/reorder", h.reorderModules)
	})
	r.Route("/modules/{moduleId}", func(r chi.Router) {
		r.Patch("/", h.updateModule)
		r.Delete("/", h.removeModule)
	})
}

type courseResponse struct {
	ID          uuid.UUID        `json:"id"`
	Title       string           `json:"title"`
	Slug        string           `json:"slug"`
	Description string           `json:"description"`
	Status      string           `json:"status"`
	Version     int              `json:"version"`
	Metadata    map[string]any   `json:"metadata"`
	PublishedAt *time.Time       `json:"published_at"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Modules     []moduleResponse `json:"modules,omitempty"`
}

func toCourseResponse(c *ent.Course) courseResponse {
	resp := courseResponse{
		ID:          c.ID,
		Title:       c.Title,
		Slug:        c.Slug,
		Description: c.Description,
		Status:      c.Status,
		Version:     c.Version,
		Metadata:    c.Metadata,
		PublishedAt: c.PublishedAt,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}

	if modules := c.Edges.Modules; len(modules) > 0 {
		resp.Modules = make([]moduleResponse, 0, len(modules))
		for _, m := range modules {
			resp.Modules = append(resp.Modules, toModuleResponse(m))
		}
	}

	return resp
}

type createCourseRequest struct {
	Title       string         `json:"title"`
	Slug        string         `json:"slug"`
	Description string         `json:"description"`
	Metadata    map[string]any `json:"metadata"`
}

func (h *CourseHandler) create(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}

	var req createCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}

	courseEntity, err := h.service.Create(r.Context(), course.CreateCourseInput{
		OrganizationID: orgID,
		Title:          req.Title,
		Slug:           req.Slug,
		Description:    req.Description,
		Metadata:       req.Metadata,
	})
	if err != nil {
		switch {
		case errors.Is(err, course.ErrInvalidInput):
			respondError(w, http.StatusBadRequest, "données invalides")
		case errors.Is(err, course.ErrSlugTaken):
			respondError(w, http.StatusConflict, "slug déjà utilisé")
		default:
			respondError(w, http.StatusInternalServerError, "erreur création cours")
		}
		return
	}

	respondJSON(w, http.StatusCreated, toCourseResponse(courseEntity))
}

func (h *CourseHandler) list(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	filter := course.CourseFilter{Status: r.URL.Query().Get("status")}
	courses, err := h.service.List(r.Context(), orgID, filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "impossible de lister les cours")
		return
	}
	resp := make([]courseResponse, 0, len(courses))
	for _, c := range courses {
		resp = append(resp, toCourseResponse(c))
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *CourseHandler) get(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	entity, err := h.service.Get(r.Context(), orgID, courseID)
	if err != nil {
		if errors.Is(err, course.ErrNotFound) {
			respondError(w, http.StatusNotFound, "cours introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur serveur")
		}
		return
	}
	respondJSON(w, http.StatusOK, toCourseResponse(entity))
}

type updateCourseRequest struct {
	Title       *string        `json:"title"`
	Description *string        `json:"description"`
	Metadata    map[string]any `json:"metadata"`
}

func (h *CourseHandler) update(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	var req updateCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}

	entity, err := h.service.Update(r.Context(), orgID, courseID, course.UpdateCourseInput{
		Title:       req.Title,
		Description: req.Description,
		Metadata:    req.Metadata,
	})
	if err != nil {
		if errors.Is(err, course.ErrInvalidInput) {
			respondError(w, http.StatusBadRequest, "données invalides")
		} else if errors.Is(err, course.ErrNotFound) {
			respondError(w, http.StatusNotFound, "cours introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur mise à jour")
		}
		return
	}
	respondJSON(w, http.StatusOK, toCourseResponse(entity))
}

func (h *CourseHandler) publish(w http.ResponseWriter, r *http.Request) {
	h.updateStatus(w, r, h.service.Publish)
}

func (h *CourseHandler) unpublish(w http.ResponseWriter, r *http.Request) {
	h.updateStatus(w, r, h.service.Unpublish)
}

func (h *CourseHandler) archive(w http.ResponseWriter, r *http.Request) {
	h.updateStatus(w, r, h.service.Archive)
}

type courseStatusFunc func(ctx context.Context, orgID, courseID uuid.UUID) (*ent.Course, error)

func (h *CourseHandler) updateStatus(w http.ResponseWriter, r *http.Request, fn courseStatusFunc) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}
	entity, err := fn(r.Context(), orgID, courseID)
	if err != nil {
		if errors.Is(err, course.ErrNotFound) {
			respondError(w, http.StatusNotFound, "cours introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur mise à jour statut")
		}
		return
	}
	respondJSON(w, http.StatusOK, toCourseResponse(entity))
}

type moduleResponse struct {
	ID              uuid.UUID      `json:"id"`
	CourseID        uuid.UUID      `json:"course_id"`
	Title           string         `json:"title"`
	ModuleType      string         `json:"module_type"`
	ContentID       *uuid.UUID     `json:"content_id,omitempty"`
	Position        int            `json:"position"`
	OrderIndex      int            `json:"order_index"`
	DurationSeconds int            `json:"duration_seconds"`
	Status          string         `json:"status"`
	Data            map[string]any `json:"data"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

func toModuleResponse(m *ent.Module) moduleResponse {
	return moduleResponse{
		ID:              m.ID,
		CourseID:        m.CourseID,
		Title:           m.Title,
		ModuleType:      m.ModuleType,
		ContentID:       m.ContentID,
		Position:        m.Position,
		OrderIndex:      m.Position,
		DurationSeconds: m.DurationSeconds,
		Status:          m.Status,
		Data:            m.Data,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
}

type moduleRequest struct {
	Title        string         `json:"title"`
	ModuleType   string         `json:"module_type"`
	ContentID    *uuid.UUID     `json:"content_id"`
	DurationSecs int            `json:"duration_seconds"`
	Data         map[string]any `json:"data"`
}

func (h *CourseHandler) addModule(w http.ResponseWriter, r *http.Request) {
	orgID, courseID, ok := h.parseCourseContext(w, r)
	if !ok {
		return
	}
	var req moduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	module, err := h.service.AddModule(r.Context(), orgID, courseID, course.ModuleInput{
		Title:        req.Title,
		ModuleType:   req.ModuleType,
		ContentID:    req.ContentID,
		DurationSecs: req.DurationSecs,
		Data:         req.Data,
	})
	if err != nil {
		if errors.Is(err, course.ErrInvalidInput) {
			respondError(w, http.StatusBadRequest, "données invalides")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur module")
		}
		return
	}
	respondJSON(w, http.StatusCreated, toModuleResponse(module))
}

func (h *CourseHandler) listModules(w http.ResponseWriter, r *http.Request) {
	orgID, courseID, ok := h.parseCourseContext(w, r)
	if !ok {
		return
	}
	modules, err := h.service.ListModules(r.Context(), orgID, courseID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "liste modules impossible")
		return
	}
	resp := make([]moduleResponse, 0, len(modules))
	for _, m := range modules {
		resp = append(resp, toModuleResponse(m))
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *CourseHandler) updateModule(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	moduleID, err := uuid.Parse(chi.URLParam(r, "moduleId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}

	var req moduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	module, err := h.service.UpdateModule(r.Context(), orgID, moduleID, course.ModuleInput{
		Title:        req.Title,
		ModuleType:   req.ModuleType,
		ContentID:    req.ContentID,
		DurationSecs: req.DurationSecs,
		Data:         req.Data,
	})
	if err != nil {
		if errors.Is(err, course.ErrNotFound) {
			respondError(w, http.StatusNotFound, "module introuvable")
		} else if errors.Is(err, course.ErrInvalidInput) {
			respondError(w, http.StatusBadRequest, "données invalides")
		} else {
			respondError(w, http.StatusInternalServerError, "erreur module")
		}
		return
	}
	respondJSON(w, http.StatusOK, toModuleResponse(module))
}

func (h *CourseHandler) removeModule(w http.ResponseWriter, r *http.Request) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return
	}
	moduleID, err := uuid.Parse(chi.URLParam(r, "moduleId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return
	}
	if err := h.service.RemoveModule(r.Context(), orgID, moduleID); err != nil {
		if errors.Is(err, course.ErrNotFound) {
			respondError(w, http.StatusNotFound, "module introuvable")
		} else {
			respondError(w, http.StatusInternalServerError, "suppression impossible")
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type reorderRequest struct {
	ModuleIDs []uuid.UUID `json:"module_ids"`
}

func (h *CourseHandler) reorderModules(w http.ResponseWriter, r *http.Request) {
	orgID, courseID, ok := h.parseCourseContext(w, r)
	if !ok {
		return
	}
	var req reorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "payload invalide")
		return
	}
	if err := h.service.ReorderModules(r.Context(), orgID, courseID, req.ModuleIDs); err != nil {
		if errors.Is(err, course.ErrInvalidInput) {
			respondError(w, http.StatusBadRequest, "ordre invalide")
		} else {
			respondError(w, http.StatusInternalServerError, "réordonnancement impossible")
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *CourseHandler) parseCourseContext(w http.ResponseWriter, r *http.Request) (uuid.UUID, uuid.UUID, bool) {
	orgID, err := tenant.OrganizationID(r.Context())
	if err != nil {
		respondError(w, http.StatusBadRequest, "organisation manquante")
		return uuid.Nil, uuid.Nil, false
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "identifiant invalide")
		return uuid.Nil, uuid.Nil, false
	}
	return orgID, courseID, true
}
