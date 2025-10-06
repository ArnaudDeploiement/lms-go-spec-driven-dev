package user

import "errors"

var (
	ErrInvalidInput     = errors.New("user: invalid input")
	ErrEmailAlreadyUsed = errors.New("user: email already used")
	ErrNotFound         = errors.New("user: not found")
)
