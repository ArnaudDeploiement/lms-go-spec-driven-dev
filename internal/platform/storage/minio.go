package storage

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Config regroupe les paramètres nécessaires pour se connecter à MinIO/S3.
type Config struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

// Client encapsule un client MinIO et le bucket ciblé.
type Client struct {
	minio *minio.Client
	bucket string
}

// NewMinioClient instancie un client MinIO prêt à l'emploi et vérifie le bucket.
func NewMinioClient(ctx context.Context, cfg Config) (*Client, error) {
	if cfg.Endpoint == "" || cfg.AccessKey == "" || cfg.SecretKey == "" {
		return nil, fmt.Errorf("storage: missing configuration")
	}
	if cfg.Bucket == "" {
		return nil, fmt.Errorf("storage: bucket required")
	}

	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("storage: init minio: %w", err)
	}

	s := &Client{minio: client, bucket: cfg.Bucket}
	if err := s.ensureBucket(ctx); err != nil {
		return nil, err
	}
	return s, nil
}

func (c *Client) ensureBucket(ctx context.Context) error {
	exists, err := c.minio.BucketExists(ctx, c.bucket)
	if err != nil {
		return fmt.Errorf("storage: bucket exists check: %w", err)
	}
	if exists {
		return nil
	}
	if err := c.minio.MakeBucket(ctx, c.bucket, minio.MakeBucketOptions{}); err != nil {
		return fmt.Errorf("storage: create bucket: %w", err)
	}
	return nil
}

// PresignUpload renvoie une URL pré-signée pour PUT un objet.
func (c *Client) PresignUpload(ctx context.Context, object string, contentType string, expires time.Duration) (string, error) {
	reqParams := make(url.Values)
	if contentType != "" {
		reqParams.Set("content-type", contentType)
	}
	u, err := c.minio.PresignedPutObject(ctx, c.bucket, object, expires)
	if err != nil {
		return "", fmt.Errorf("storage: presign upload: %w", err)
	}
	if contentType != "" {
		// Append content-type manually when using PresignedPutObject.
		q := u.Query()
		q.Set("content-type", contentType)
		u.RawQuery = q.Encode()
	}
	return u.String(), nil
}

// PresignDownload renvoie une URL GET pré-signée pour télécharger un objet.
func (c *Client) PresignDownload(ctx context.Context, object string, expires time.Duration) (string, error) {
	u, err := c.minio.PresignedGetObject(ctx, c.bucket, object, expires, nil)
	if err != nil {
		return "", fmt.Errorf("storage: presign download: %w", err)
	}
	return u.String(), nil
}

// Remove supprime un objet du bucket (utilisé lors d'archivage).
func (c *Client) Remove(ctx context.Context, object string) error {
	if err := c.minio.RemoveObject(ctx, c.bucket, object, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("storage: remove object: %w", err)
	}
	return nil
}
