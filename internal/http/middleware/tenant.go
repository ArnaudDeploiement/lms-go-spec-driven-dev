package middleware

import (
	"net/http"

	"github.com/google/uuid"

	"lms-go/internal/tenant"
)

const headerOrgID = "X-Org-ID"

// TenantFromHeader extrait l'identifiant d'organisation depuis l'entête X-Org-ID.
func TenantFromHeader(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := r.Header.Get(headerOrgID)
		if raw == "" {
			http.Error(w, "missing X-Org-ID header", http.StatusBadRequest)
			return
		}
		orgID, err := uuid.Parse(raw)
		if err != nil {
			http.Error(w, "invalid X-Org-ID header", http.StatusBadRequest)
			return
		}
		ctx := tenant.WithOrganization(r.Context(), orgID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
