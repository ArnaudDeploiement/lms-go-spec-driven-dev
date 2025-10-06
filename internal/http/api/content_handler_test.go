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

    "lms-go/internal/content"
    "lms-go/internal/ent"
    httpmiddleware "lms-go/internal/http/middleware"
    "lms-go/internal/organization"

    _ "github.com/glebarez/go-sqlite"
)

type stubStorage struct{}

func (s stubStorage) PresignUpload(ctx context.Context, object string, contentType string, expires time.Duration) (string, error) {
    return "https://upload/" + object, nil
}

func (s stubStorage) PresignDownload(ctx context.Context, object string, expires time.Duration) (string, error) {
    return "https://download/" + object, nil
}

func (s stubStorage) Remove(ctx context.Context, object string) error { return nil }

func newContentHandlerEnv(t *testing.T) (*content.Service, uuid.UUID, func()) {
    db, err := sql.Open("sqlite", "file:contenthandler?mode=memory&cache=shared")
    require.NoError(t, err)
    _, err = db.Exec("PRAGMA foreign_keys = ON")
    require.NoError(t, err)

    driver := entsql.OpenDB(dialect.SQLite, db)
    client := ent.NewClient(ent.Driver(driver))
    ctx := context.Background()
    require.NoError(t, client.Schema.Create(ctx))

    orgSvc := organization.NewService(client)
    org, err := orgSvc.Create(ctx, organization.CreateInput{Name: "Org", Slug: "org"})
    require.NoError(t, err)

    svc := content.NewService(client, stubStorage{}, content.Config{})
    cleanup := func() {
        _ = client.Close()
        _ = db.Close()
    }
    return svc, org.ID, cleanup
}

func setupContentRouter(t *testing.T) (*chi.Mux, uuid.UUID) {
    svc, orgID, cleanup := newContentHandlerEnv(t)
    t.Cleanup(cleanup)
    handler := NewContentHandler(svc)
    router := chi.NewRouter()
    router.Use(httpmiddleware.TenantFromHeader)
    handler.Mount(router)
    return router, orgID
}

func reqWithOrg(method, target string, orgID uuid.UUID, body []byte) *http.Request {
    req := httptest.NewRequest(method, target, bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-Org-ID", orgID.String())
    return req
}

func TestContentHandler_CreateAndList(t *testing.T) {
    router, orgID := setupContentRouter(t)

    payload := map[string]any{
        "name": "Demo.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 1024,
    }
    body, _ := json.Marshal(payload)
    req := reqWithOrg(http.MethodPost, "/", orgID, body)
    rec := httptest.NewRecorder()
    router.ServeHTTP(rec, req)
    require.Equal(t, http.StatusCreated, rec.Code)

    listReq := reqWithOrg(http.MethodGet, "/", orgID, nil)
    listRec := httptest.NewRecorder()
    router.ServeHTTP(listRec, listReq)
    require.Equal(t, http.StatusOK, listRec.Code)
}

func TestContentHandler_FinalizeAndDownload(t *testing.T) {
    router, orgID := setupContentRouter(t)

    createPayload := map[string]any{
        "name": "file.txt",
        "mime_type": "text/plain",
    }
    createBody, _ := json.Marshal(createPayload)
    createReq := reqWithOrg(http.MethodPost, "/", orgID, createBody)
    createRec := httptest.NewRecorder()
    router.ServeHTTP(createRec, createReq)
    require.Equal(t, http.StatusCreated, createRec.Code)

    var resp map[string]any
    require.NoError(t, json.Unmarshal(createRec.Body.Bytes(), &resp))
    contentResp := resp["content"].(map[string]any)
    id := contentResp["id"].(string)

    finalizeBody, _ := json.Marshal(map[string]any{"size_bytes": 2048})
    finReq := reqWithOrg(http.MethodPost, "/"+id+"/finalize", orgID, finalizeBody)
    finRec := httptest.NewRecorder()
    router.ServeHTTP(finRec, finReq)
    require.Equal(t, http.StatusOK, finRec.Code)

    dlReq := reqWithOrg(http.MethodGet, "/"+id+"/download", orgID, nil)
    dlRec := httptest.NewRecorder()
    router.ServeHTTP(dlRec, dlReq)
    require.Equal(t, http.StatusOK, dlRec.Code)
}
