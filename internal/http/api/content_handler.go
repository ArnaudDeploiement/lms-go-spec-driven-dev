package api

import (
    "encoding/json"
    "errors"
    "io"
    "net/http"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/google/uuid"

    "lms-go/internal/content"
    "lms-go/internal/ent"
    "lms-go/internal/tenant"
)

type ContentHandler struct {
    service *content.Service
}

func NewContentHandler(service *content.Service) *ContentHandler {
    return &ContentHandler{service: service}
}

func (h *ContentHandler) Mount(r chi.Router) {
    r.Get("/", h.list)
    r.Post("/", h.create)
    r.Route("/{id}", func(r chi.Router) {
        r.Get("/", h.get)
        r.Post("/finalize", h.finalize)
        r.Delete("/", h.archive)
        r.Get("/download", h.download)
    })
}

type contentResponse struct {
    ID        uuid.UUID      `json:"id"`
    Name      string         `json:"name"`
    MimeType  string         `json:"mime_type"`
    SizeBytes int64          `json:"size_bytes"`
    Status    string         `json:"status"`
    Metadata  map[string]any `json:"metadata"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    StorageKey string        `json:"storage_key"`
}

func toContentResponse(c *ent.Content) contentResponse {
    return contentResponse{
        ID:         c.ID,
        Name:       c.Name,
        MimeType:   c.MimeType,
        SizeBytes:  c.SizeBytes,
        Status:     c.Status,
        Metadata:   c.Metadata,
        CreatedAt:  c.CreatedAt,
        UpdatedAt:  c.UpdatedAt,
        StorageKey: c.StorageKey,
    }
}

type createContentRequest struct {
    Name      string         `json:"name"`
    MimeType  string         `json:"mime_type"`
    SizeBytes int64          `json:"size_bytes"`
    Metadata  map[string]any `json:"metadata"`
}

func (h *ContentHandler) create(w http.ResponseWriter, r *http.Request) {
    orgID, err := tenant.OrganizationID(r.Context())
    if err != nil {
        respondError(w, http.StatusBadRequest, "organisation manquante")
        return
    }

    var req createContentRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "payload invalide")
        return
    }

    link, err := h.service.CreateUpload(r.Context(), content.CreateUploadInput{
        OrganizationID: orgID,
        Name:           req.Name,
        MimeType:       req.MimeType,
        SizeBytes:      req.SizeBytes,
        Metadata:       req.Metadata,
    })
    if err != nil {
        if errors.Is(err, content.ErrInvalidInput) {
            respondError(w, http.StatusBadRequest, "données invalides")
        } else {
            respondError(w, http.StatusInternalServerError, "erreur création contenu")
        }
        return
    }

    respondJSON(w, http.StatusCreated, map[string]any{
        "content":    toContentResponse(link.Content),
        "upload_url": link.UploadURL,
        "expires_at": link.ExpiresAt,
    })
}

func (h *ContentHandler) list(w http.ResponseWriter, r *http.Request) {
    orgID, err := tenant.OrganizationID(r.Context())
    if err != nil {
        respondError(w, http.StatusBadRequest, "organisation manquante")
        return
    }
    contents, err := h.service.List(r.Context(), orgID)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "impossible de lister les contenus")
        return
    }
    out := make([]contentResponse, 0, len(contents))
    for _, c := range contents {
        out = append(out, toContentResponse(c))
    }
    respondJSON(w, http.StatusOK, out)
}

func (h *ContentHandler) get(w http.ResponseWriter, r *http.Request) {
    orgID, err := tenant.OrganizationID(r.Context())
    if err != nil {
        respondError(w, http.StatusBadRequest, "organisation manquante")
        return
    }
    contentID, err := uuid.Parse(chi.URLParam(r, "id"))
    if err != nil {
        respondError(w, http.StatusBadRequest, "identifiant invalide")
        return
    }
    entity, err := h.service.Get(r.Context(), orgID, contentID)
    if err != nil {
        if errors.Is(err, content.ErrNotFound) {
            respondError(w, http.StatusNotFound, "contenu introuvable")
        } else {
            respondError(w, http.StatusInternalServerError, "erreur serveur")
        }
        return
    }
    respondJSON(w, http.StatusOK, toContentResponse(entity))
}

type finalizeRequest struct {
    Name      *string        `json:"name"`
    MimeType  *string        `json:"mime_type"`
    SizeBytes *int64         `json:"size_bytes"`
    Metadata  map[string]any `json:"metadata"`
}

func (h *ContentHandler) finalize(w http.ResponseWriter, r *http.Request) {
    orgID, err := tenant.OrganizationID(r.Context())
    if err != nil {
        respondError(w, http.StatusBadRequest, "organisation manquante")
        return
    }
    contentID, err := uuid.Parse(chi.URLParam(r, "id"))
    if err != nil {
        respondError(w, http.StatusBadRequest, "identifiant invalide")
        return
    }

    var req finalizeRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
        respondError(w, http.StatusBadRequest, "payload invalide")
        return
    }

    entity, err := h.service.Finalize(r.Context(), orgID, contentID, content.FinalizeInput{
        Name:      req.Name,
        MimeType:  req.MimeType,
        SizeBytes: req.SizeBytes,
        Metadata:  req.Metadata,
    })
    if err != nil {
        switch {
        case errors.Is(err, content.ErrInvalidInput):
            respondError(w, http.StatusBadRequest, "données invalides")
        case errors.Is(err, content.ErrNotFound):
            respondError(w, http.StatusNotFound, "contenu introuvable")
        default:
            respondError(w, http.StatusInternalServerError, "erreur de finalisation")
        }
        return
    }

    respondJSON(w, http.StatusOK, toContentResponse(entity))
}

func (h *ContentHandler) archive(w http.ResponseWriter, r *http.Request) {
    orgID, err := tenant.OrganizationID(r.Context())
    if err != nil {
        respondError(w, http.StatusBadRequest, "organisation manquante")
        return
    }
    contentID, err := uuid.Parse(chi.URLParam(r, "id"))
    if err != nil {
        respondError(w, http.StatusBadRequest, "identifiant invalide")
        return
    }

    if err := h.service.Archive(r.Context(), orgID, contentID); err != nil {
        if errors.Is(err, content.ErrNotFound) {
            respondError(w, http.StatusNotFound, "contenu introuvable")
        } else {
            respondError(w, http.StatusInternalServerError, "impossible d'archiver")
        }
        return
    }
    w.WriteHeader(http.StatusNoContent)
}

func (h *ContentHandler) download(w http.ResponseWriter, r *http.Request) {
    orgID, err := tenant.OrganizationID(r.Context())
    if err != nil {
        respondError(w, http.StatusBadRequest, "organisation manquante")
        return
    }
    contentID, err := uuid.Parse(chi.URLParam(r, "id"))
    if err != nil {
        respondError(w, http.StatusBadRequest, "identifiant invalide")
        return
    }

    url, expires, err := h.service.PresignDownload(r.Context(), orgID, contentID)
    if err != nil {
        if errors.Is(err, content.ErrNotFound) {
            respondError(w, http.StatusNotFound, "contenu introuvable")
        } else {
            respondError(w, http.StatusInternalServerError, "erreur téléchargement")
        }
        return
    }
    respondJSON(w, http.StatusOK, map[string]any{
        "download_url": url,
        "expires_at":   expires,
    })
}
