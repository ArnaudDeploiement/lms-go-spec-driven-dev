package database

import (
	"context"
	"database/sql"
	"fmt"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "github.com/lib/pq"

	"lms-go/internal/ent"
)

// Config contient les paramètres de connexion base de données.
type Config struct {
	URL string
}

// NewClient ouvre un client ent connecté à PostgreSQL.
func NewClient(ctx context.Context, cfg Config) (*ent.Client, error) {
	if cfg.URL == "" {
		return nil, fmt.Errorf("database: missing URL")
	}

	db, err := sql.Open("postgres", cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("database: open: %w", err)
	}
	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("database: ping: %w", err)
	}

	driver := entsql.OpenDB(dialect.Postgres, db)
	return ent.NewClient(ent.Driver(driver)), nil
}

// Migrate applique les migrations.
func Migrate(ctx context.Context, client *ent.Client) error {
	if client == nil {
		return fmt.Errorf("database: nil client")
	}
	return client.Schema.Create(ctx)
}
