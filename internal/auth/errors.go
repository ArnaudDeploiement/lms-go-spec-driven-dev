package auth

import "errors"

var (
	ErrEmailAlreadyUsed   = errors.New("auth: email already used")
	ErrInvalidCredentials = errors.New("auth: invalid credentials")
	ErrUserInactive       = errors.New("auth: user inactive")
	ErrInvalidToken       = errors.New("auth: invalid token")
)
