package organization

import "errors"

var (
	ErrSlugAlreadyUsed = errors.New("organization: slug already used")
	ErrNotFound        = errors.New("organization: not found")
	ErrInvalidInput    = errors.New("organization: invalid input")
)
