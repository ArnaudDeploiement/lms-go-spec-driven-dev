package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config regroupe la configuration applicative principale.
type Config struct {
	APIAddr               string
	DatabaseURL           string
	ShutdownTimeout       time.Duration
	ReadHeaderTimeout     time.Duration
	JWTSecret             string
	AccessTokenTTL        time.Duration
	RefreshTokenTTL       time.Duration
	StorageEndpoint       string
	StorageAccessKey      string
	StorageSecretKey      string
	StorageBucket         string
	StorageUseSSL         bool
	StoragePublicEndpoint string
}

const (
	defaultAPIAddr           = ":8080"
	defaultShutdownTimeout   = 10 * time.Second
	defaultReadHeaderTimeout = 5 * time.Second
	defaultAccessTokenTTL    = 15 * time.Minute
	defaultRefreshTokenTTL   = 72 * time.Hour
	defaultStorageBucket     = "lms-go"
)

// Load construit la configuration depuis les variables d'environnement.
func Load() (*Config, error) {
	cfg := &Config{
		APIAddr:               getEnv("API_ADDR", defaultAPIAddr),
		DatabaseURL:           os.Getenv("DATABASE_URL"),
		ShutdownTimeout:       durationEnv("SHUTDOWN_TIMEOUT", defaultShutdownTimeout),
		ReadHeaderTimeout:     durationEnv("READ_HEADER_TIMEOUT", defaultReadHeaderTimeout),
		JWTSecret:             os.Getenv("JWT_SECRET"),
		AccessTokenTTL:        durationEnv("ACCESS_TOKEN_TTL", defaultAccessTokenTTL),
		RefreshTokenTTL:       durationEnv("REFRESH_TOKEN_TTL", defaultRefreshTokenTTL),
		StorageEndpoint:       os.Getenv("MINIO_ENDPOINT"),
		StorageAccessKey:      os.Getenv("MINIO_ROOT_USER"),
		StorageSecretKey:      os.Getenv("MINIO_ROOT_PASSWORD"),
		StorageBucket:         getEnv("MINIO_BUCKET", defaultStorageBucket),
		StorageUseSSL:         boolEnv("MINIO_USE_SSL", false),
		StoragePublicEndpoint: os.Getenv("MINIO_PUBLIC_ENDPOINT"),
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("config: DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("config: JWT_SECRET is required")
	}
	if cfg.StorageEndpoint == "" {
		return nil, fmt.Errorf("config: MINIO_ENDPOINT is required")
	}
	if cfg.StorageAccessKey == "" || cfg.StorageSecretKey == "" {
		return nil, fmt.Errorf("config: MINIO credentials required")
	}
	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func durationEnv(key string, fallback time.Duration) time.Duration {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	d, err := time.ParseDuration(val)
	if err != nil {
		return fallback
	}
	return d
}

func boolEnv(key string, fallback bool) bool {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	b, err := strconv.ParseBool(val)
	if err != nil {
		return fallback
	}
	return b
}
