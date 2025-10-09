package auth

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"lms-go/internal/ent"
	entuser "lms-go/internal/ent/user"
)

// Service gère les opérations d'authentification (inscription, connexion, refresh).
type Service struct {
	client *ent.Client
	tokens *Manager
	now    func() time.Time
}

// Config configure le service d'authentification.
type Config struct {
	JWTSecret       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

// NewService crée une instance de Service.
func NewService(client *ent.Client, cfg Config) *Service {
	tokenManager := NewManager(ManagerConfig{
		Secret:          cfg.JWTSecret,
		AccessTokenTTL:  cfg.AccessTokenTTL,
		RefreshTokenTTL: cfg.RefreshTokenTTL,
	})
	return &Service{
		client: client,
		tokens: tokenManager,
		now:    time.Now,
	}
}

func (s *Service) withNow(now func() time.Time) {
	if now != nil {
		s.now = now
		s.tokens.withNow(now)
	}
}

// RegisterInput contient les informations nécessaires pour créer un utilisateur.
type RegisterInput struct {
	OrganizationID uuid.UUID
	Email          string
	Password       string
	Role           string
	Metadata       map[string]any
}

// Register crée un nouvel utilisateur après avoir hashé son mot de passe.
func (s *Service) Register(ctx context.Context, input RegisterInput) (*ent.User, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" {
		return nil, ErrInvalidCredentials
	}

	passwordHash, err := HashPassword(strings.TrimSpace(input.Password))
	if err != nil {
		return nil, err
	}

	role := input.Role
	if role == "" {
		role = "learner"
	}

	metadata := input.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	user, err := s.client.User.Create().
		SetOrganizationID(input.OrganizationID).
		SetEmail(email).
		SetPasswordHash(passwordHash).
		SetRole(role).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrEmailAlreadyUsed
		}
		return nil, err
	}

	return user, nil
}

// Login authentifie l'utilisateur et renvoie un couple de tokens.
func (s *Service) Login(ctx context.Context, organizationID uuid.UUID, email, password string) (TokenPair, error) {
	normalized := strings.TrimSpace(strings.ToLower(email))
	if normalized == "" {
		return TokenPair{}, ErrInvalidCredentials
	}

	user, err := s.client.User.Query().
		Where(
			entuser.EmailEQ(normalized),
			entuser.OrganizationIDEQ(organizationID),
		).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return TokenPair{}, ErrInvalidCredentials
		}
		return TokenPair{}, err
	}

	if user.Status != "active" {
		return TokenPair{}, ErrUserInactive
	}

	if err := VerifyPassword(user.PasswordHash, password); err != nil {
		return TokenPair{}, ErrInvalidCredentials
	}

	tokens, refreshID, err := s.tokens.IssuePair(user.ID, organizationID, user.Role)
	if err != nil {
		return TokenPair{}, err
	}

	_, err = s.client.User.UpdateOneID(user.ID).
		SetRefreshTokenID(refreshID).
		SetLastLoginAt(s.now()).
		Save(ctx)
	if err != nil {
		return TokenPair{}, err
	}

	return tokens, nil
}

// Refresh consomme un refresh token et renvoie un nouveau couple token.
func (s *Service) Refresh(ctx context.Context, refreshToken string) (TokenPair, error) {
	claims, err := s.tokens.ParseClaims(refreshToken)
	if err != nil {
		return TokenPair{}, ErrInvalidToken
	}
	if claims.TokenType != "refresh" || claims.RefreshTokenID == "" {
		return TokenPair{}, ErrInvalidToken
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return TokenPair{}, ErrInvalidToken
	}
	orgID, err := uuid.Parse(claims.OrganizationID)
	if err != nil {
		return TokenPair{}, ErrInvalidToken
	}

	user, err := s.client.User.Query().
		Where(
			entuser.IDEQ(userID),
			entuser.OrganizationIDEQ(orgID),
		).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return TokenPair{}, ErrInvalidToken
		}
		return TokenPair{}, err
	}

	if user.RefreshTokenID == nil || *user.RefreshTokenID != claims.RefreshTokenID {
		return TokenPair{}, ErrInvalidToken
	}

	tokens, newRefreshID, err := s.tokens.IssuePair(user.ID, orgID, user.Role)
	if err != nil {
		return TokenPair{}, err
	}

	_, err = s.client.User.UpdateOneID(user.ID).
		SetRefreshTokenID(newRefreshID).
		Save(ctx)
	if err != nil {
		return TokenPair{}, err
	}

	return tokens, nil
}

// ClearRefreshToken met à jour l'utilisateur pour invalider les tokens actifs (logout).
func (s *Service) ClearRefreshToken(ctx context.Context, userID uuid.UUID) error {
	return s.client.User.UpdateOneID(userID).
		ClearRefreshTokenID().
		Exec(ctx)
}

// SignupInput contient les informations pour créer une organisation avec un admin initial.
type SignupInput struct {
	OrgName  string
	OrgSlug  string
	Email    string
	Password string
	Metadata map[string]any
}

// Signup crée une nouvelle organisation avec un utilisateur admin initial.
// Utile pour l'inscription initiale depuis le frontend Next.js.
func (s *Service) Signup(ctx context.Context, input SignupInput) (*ent.Organization, *ent.User, TokenPair, error) {
	// Validation
	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || input.Password == "" || input.OrgName == "" {
		return nil, nil, TokenPair{}, ErrInvalidCredentials
	}

	// Hash du mot de passe
	passwordHash, err := HashPassword(strings.TrimSpace(input.Password))
	if err != nil {
		return nil, nil, TokenPair{}, err
	}

	// Sanitize slug
	slug := input.OrgSlug
	if slug == "" {
		slug = input.OrgName
	}

	// Transaction pour créer org + user atomiquement
	tx, err := s.client.Tx(ctx)
	if err != nil {
		return nil, nil, TokenPair{}, err
	}

	// Rollback en cas d'erreur
	defer func() {
		if v := recover(); v != nil {
			_ = tx.Rollback()
			panic(v)
		}
	}()

	// Créer l'organisation
	org, err := tx.Organization.Create().
		SetName(input.OrgName).
		SetSlug(slug).
		SetSettings(map[string]any{}).
		Save(ctx)
	if err != nil {
		_ = tx.Rollback()
		if ent.IsConstraintError(err) {
			return nil, nil, TokenPair{}, ErrEmailAlreadyUsed // Réutilise l'erreur pour slug duplicate
		}
		return nil, nil, TokenPair{}, err
	}

	// Créer l'utilisateur admin
	metadata := input.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	user, err := tx.User.Create().
		SetOrganizationID(org.ID).
		SetEmail(email).
		SetPasswordHash(passwordHash).
		SetRole("admin").
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		_ = tx.Rollback()
		if ent.IsConstraintError(err) {
			return nil, nil, TokenPair{}, ErrEmailAlreadyUsed
		}
		return nil, nil, TokenPair{}, err
	}

	// Générer les tokens
	tokens, refreshID, err := s.tokens.IssuePair(user.ID, org.ID, user.Role)
	if err != nil {
		_ = tx.Rollback()
		return nil, nil, TokenPair{}, err
	}

	// Mettre à jour le refresh token de l'utilisateur
	user, err = tx.User.UpdateOneID(user.ID).
		SetRefreshTokenID(refreshID).
		SetLastLoginAt(s.now()).
		Save(ctx)
	if err != nil {
		_ = tx.Rollback()
		return nil, nil, TokenPair{}, err
	}

	// Commit de la transaction
	if err := tx.Commit(); err != nil {
		return nil, nil, TokenPair{}, err
	}

	return org, user, tokens, nil
}
