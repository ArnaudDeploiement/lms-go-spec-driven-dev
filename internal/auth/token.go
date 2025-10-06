package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	tokenIssuer      = "lms-go"
	tokenAudienceAPI = "api"
)

// Claims représente les claims JWT utilisés par le LMS.
type Claims struct {
	OrganizationID string `json:"org"`
	Role           string `json:"role"`
	TokenType      string `json:"typ"`
	RefreshTokenID string `json:"rtid,omitempty"`
	jwt.RegisteredClaims
}

// TokenPair contient l'access token et le refresh token générés pour un utilisateur.
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// Manager gère la génération et la validation des tokens JWT.
type Manager struct {
	secret          []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
	now             func() time.Time
}

// ManagerConfig configure le Manager JWT.
type ManagerConfig struct {
	Secret          string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

// NewManager retourne un manager JWT initialisé.
func NewManager(cfg ManagerConfig) *Manager {
	return &Manager{
		secret:          []byte(cfg.Secret),
		accessTokenTTL:  cfg.AccessTokenTTL,
		refreshTokenTTL: cfg.RefreshTokenTTL,
		now:             time.Now,
	}
}

func (m *Manager) withNow(now func() time.Time) {
	if now != nil {
		m.now = now
	}
}

// IssuePair génère un couple access/refresh token pour l'utilisateur donné.
func (m *Manager) IssuePair(userID uuid.UUID, orgID uuid.UUID, role string) (TokenPair, string, error) {
	issuedAt := m.now()
	accessExp := issuedAt.Add(m.accessTokenTTL)
	refreshExp := issuedAt.Add(m.refreshTokenTTL)
	refreshID := uuid.NewString()

	accessClaims := &Claims{
		OrganizationID: orgID.String(),
		Role:           role,
		TokenType:      "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    tokenIssuer,
			Audience:  []string{tokenAudienceAPI},
			IssuedAt:  jwt.NewNumericDate(issuedAt),
			ExpiresAt: jwt.NewNumericDate(accessExp),
		},
	}

	refreshClaims := &Claims{
		OrganizationID: orgID.String(),
		Role:           role,
		TokenType:      "refresh",
		RefreshTokenID: refreshID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    tokenIssuer,
			Audience:  []string{tokenAudienceAPI},
			IssuedAt:  jwt.NewNumericDate(issuedAt),
			ExpiresAt: jwt.NewNumericDate(refreshExp),
		},
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(m.secret)
	if err != nil {
		return TokenPair{}, "", err
	}

	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(m.secret)
	if err != nil {
		return TokenPair{}, "", err
	}

	return TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp,
	}, refreshID, nil
}

// ParseClaims vérifie et renvoie les claims depuis un token JWT.
func (m *Manager) ParseClaims(token string) (*Claims, error) {
	parsedToken, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (any, error) {
		return m.secret, nil
	}, jwt.WithAudience(tokenAudienceAPI), jwt.WithIssuer(tokenIssuer), jwt.WithTimeFunc(m.now))
	if err != nil {
		return nil, err
	}

	claims, ok := parsedToken.Claims.(*Claims)
	if !ok || !parsedToken.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
