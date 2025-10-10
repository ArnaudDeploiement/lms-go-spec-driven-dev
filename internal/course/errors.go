package course

import "errors"

var (
	ErrInvalidInput = errors.New("course: invalid input")
	ErrNotFound     = errors.New("course: not found")
	ErrSlugTaken    = errors.New("course: slug déjà utilisé")
)
