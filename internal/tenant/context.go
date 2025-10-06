package tenant

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

type contextKey string

const organizationKey contextKey = "tenant:organization-id"

var ErrMissingTenant = errors.New("tenant: organization not found in context")

// WithOrganization injecte l'identifiant d'organisation dans le contexte.
func WithOrganization(ctx context.Context, orgID uuid.UUID) context.Context {
	return context.WithValue(ctx, organizationKey, orgID)
}

// OrganizationID extrait l'identifiant d'organisation du contexte.
func OrganizationID(ctx context.Context) (uuid.UUID, error) {
	val := ctx.Value(organizationKey)
	if val == nil {
		return uuid.UUID{}, ErrMissingTenant
	}
	id, ok := val.(uuid.UUID)
	if !ok {
		return uuid.UUID{}, ErrMissingTenant
	}
	return id, nil
}
