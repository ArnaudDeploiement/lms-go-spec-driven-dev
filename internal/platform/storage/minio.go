package storage

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Config regroupe les paramètres nécessaires pour se connecter à MinIO/S3.
type Config struct {
	Endpoint       string
	AccessKey      string
	SecretKey      string
	Bucket         string
	UseSSL         bool
	PublicEndpoint string
}

// Client encapsule un client MinIO et le bucket ciblé.
type Client struct {
	minio          *minio.Client
	bucket         string
	publicEndpoint *url.URL
}

// NewMinioClient instancie un client MinIO prêt à l'emploi et vérifie le bucket.
func NewMinioClient(ctx context.Context, cfg Config) (*Client, error) {
	if cfg.Endpoint == "" || cfg.AccessKey == "" || cfg.SecretKey == "" {
		return nil, fmt.Errorf("storage: missing configuration")
	}
	if cfg.Bucket == "" {
		return nil, fmt.Errorf("storage: bucket required")
	}

	endpoint := cfg.Endpoint
	useSSL := cfg.UseSSL

	if strings.HasPrefix(endpoint, "http://") || strings.HasPrefix(endpoint, "https://") {
		parsed, err := url.Parse(endpoint)
		if err != nil {
			return nil, fmt.Errorf("storage: parse endpoint: %w", err)
		}
		if parsed.Host == "" {
			return nil, fmt.Errorf("storage: endpoint host missing")
		}
		endpoint = parsed.Host
		if parsed.Scheme == "https" {
			useSSL = true
		}
		if parsed.Scheme == "http" {
			useSSL = false
		}
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("storage: init minio: %w", err)
	}

	var publicURL *url.URL
	if strings.TrimSpace(cfg.PublicEndpoint) != "" {
		parsed, err := parsePublicEndpoint(cfg.PublicEndpoint, useSSL)
		if err != nil {
			return nil, err
		}
		publicURL = parsed
	}

	s := &Client{minio: client, bucket: cfg.Bucket, publicEndpoint: publicURL}
	if err := s.ensureBucket(ctx); err != nil {
		return nil, err
	}
	return s, nil
}

func parsePublicEndpoint(endpoint string, useSSL bool) (*url.URL, error) {
	trimmed := strings.TrimSpace(endpoint)
	var parsed *url.URL
	var err error

	if strings.Contains(trimmed, "://") {
		parsed, err = url.Parse(trimmed)
		if err != nil {
			return nil, fmt.Errorf("storage: parse public endpoint: %w", err)
		}
		if parsed.Host == "" {
			return nil, fmt.Errorf("storage: public endpoint host missing")
		}
	} else {
		scheme := "http"
		if useSSL {
			scheme = "https"
		}
		parsed, err = url.Parse(fmt.Sprintf("%s://%s", scheme, trimmed))
		if err != nil {
			return nil, fmt.Errorf("storage: parse public endpoint: %w", err)
		}
	}

	if parsed.Scheme == "" {
		if useSSL {
			parsed.Scheme = "https"
		} else {
			parsed.Scheme = "http"
		}
	}

	return parsed, nil
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
	var headers http.Header
	if contentType != "" {
		headers = make(http.Header)
		headers.Set("Content-Type", contentType)
	}

	u, err := c.minio.PresignHeader(ctx, http.MethodPut, c.bucket, object, expires, nil, headers)
	if err != nil {
		return "", fmt.Errorf("storage: presign upload: %w", err)
	}
	c.applyPublicEndpoint(u)
	return u.String(), nil
}

// PresignDownload renvoie une URL GET pré-signée pour télécharger un objet.
func (c *Client) PresignDownload(ctx context.Context, object string, expires time.Duration) (string, error) {
	u, err := c.minio.PresignedGetObject(ctx, c.bucket, object, expires, nil)
	if err != nil {
		return "", fmt.Errorf("storage: presign download: %w", err)
	}
	c.applyPublicEndpoint(u)
	return u.String(), nil
}

// Remove supprime un objet du bucket (utilisé lors d'archivage).
func (c *Client) Remove(ctx context.Context, object string) error {
	if err := c.minio.RemoveObject(ctx, c.bucket, object, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("storage: remove object: %w", err)
	}
	return nil
}

func (c *Client) applyPublicEndpoint(u *url.URL) {
	if c.publicEndpoint == nil {
		return
	}
	u.Scheme = c.publicEndpoint.Scheme
	u.Host = c.publicEndpoint.Host
	basePath := strings.TrimSuffix(c.publicEndpoint.Path, "/")
	if basePath != "" {
		u.Path = basePath + u.Path
	}
}
