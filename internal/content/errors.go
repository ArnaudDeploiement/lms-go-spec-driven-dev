package content

import "errors"

var (
	ErrInvalidInput = errors.New("content: invalid input")
	ErrNotFound     = errors.New("content: not found")
)
