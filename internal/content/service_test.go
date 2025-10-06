package content

import (
    "context"
    "database/sql"
    "testing"
    "time"

    "github.com/google/uuid"
    "github.com/stretchr/testify/require"

    "entgo.io/ent/dialect"
    entsql "entgo.io/ent/dialect/sql"

    "lms-go/internal/ent"

    _ "github.com/glebarez/go-sqlite"
)

type mockStorage struct {
    uploads   map[string]string
    downloads map[string]string
}

func newMockStorage() *mockStorage {
    return &mockStorage{uploads: map[string]string{}, downloads: map[string]string{}}
}

func (m *mockStorage) PresignUpload(ctx context.Context, object string, contentType string, expires time.Duration) (string, error) {
    url := "https://example.com/upload/" + object
    m.uploads[object] = url
    return url, nil
}

func (m *mockStorage) PresignDownload(ctx context.Context, object string, expires time.Duration) (string, error) {
    url := "https://example.com/download/" + object
    m.downloads[object] = url
    return url, nil
}

func (m *mockStorage) Remove(ctx context.Context, object string) error {
    delete(m.uploads, object)
    delete(m.downloads, object)
    return nil
}

func newContentService(t *testing.T) (*Service, uuid.UUID, func()) {
    db, err := sql.Open("sqlite", "file:contentsvc?mode=memory&cache=shared")
    require.NoError(t, err)
    _, err = db.Exec("PRAGMA foreign_keys = ON")
    require.NoError(t, err)

    driver := entsql.OpenDB(dialect.SQLite, db)
    client := ent.NewClient(ent.Driver(driver))
    ctx := context.Background()
    require.NoError(t, client.Schema.Create(ctx))

    org, err := client.Organization.Create().
        SetName("Org").
        SetSlug("org").
        Save(ctx)
    require.NoError(t, err)

    storage := newMockStorage()
    svc := NewService(client, storage, Config{})

    cleanup := func() {
        _ = client.Close()
        _ = db.Close()
    }
    return svc, org.ID, cleanup
}

func TestService_CreateUpload(t *testing.T) {
    svc, orgID, cleanup := newContentService(t)
    t.Cleanup(cleanup)
    ctx := context.Background()

    res, err := svc.CreateUpload(ctx, CreateUploadInput{
        OrganizationID: orgID,
        Name:           "Document.pdf",
        MimeType:       "application/pdf",
        SizeBytes:      1024,
    })
    require.NoError(t, err)
    require.NotNil(t, res.Content)
    require.Equal(t, StatusPending, res.Content.Status)
    require.Contains(t, res.UploadURL, res.Content.StorageKey)
}

func TestService_FinalizeAndDownload(t *testing.T) {
    svc, orgID, cleanup := newContentService(t)
    t.Cleanup(cleanup)
    ctx := context.Background()

    res, err := svc.CreateUpload(ctx, CreateUploadInput{
        OrganizationID: orgID,
        Name:           "video.mp4",
        MimeType:       "video/mp4",
    })
    require.NoError(t, err)

    size := int64(2048)
    finalized, err := svc.Finalize(ctx, orgID, res.Content.ID, FinalizeInput{SizeBytes: &size})
    require.NoError(t, err)
    require.Equal(t, StatusAvailable, finalized.Status)
    require.Equal(t, size, finalized.SizeBytes)

    url, _, err := svc.PresignDownload(ctx, orgID, finalized.ID)
    require.NoError(t, err)
    require.Contains(t, url, finalized.StorageKey)
}

func TestService_ListArchive(t *testing.T) {
    svc, orgID, cleanup := newContentService(t)
    t.Cleanup(cleanup)
    ctx := context.Background()

    res, err := svc.CreateUpload(ctx, CreateUploadInput{
        OrganizationID: orgID,
        Name:           "note.txt",
        MimeType:       "text/plain",
    })
    require.NoError(t, err)

    list, err := svc.List(ctx, orgID)
    require.NoError(t, err)
    require.Len(t, list, 1)

    require.NoError(t, svc.Archive(ctx, orgID, res.Content.ID))

    list, err = svc.List(ctx, orgID)
    require.NoError(t, err)
    require.Len(t, list, 0)
}

func TestService_InvalidOrg(t *testing.T) {
    svc, _, cleanup := newContentService(t)
    t.Cleanup(cleanup)
    ctx := context.Background()

    _, err := svc.CreateUpload(ctx, CreateUploadInput{OrganizationID: uuid.Nil})
    require.ErrorIs(t, err, ErrInvalidInput)
}
