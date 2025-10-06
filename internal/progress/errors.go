package progress

import "errors"

var (
	ErrInvalidInput = errors.New("progress: invalid input")
	ErrNotFound     = errors.New("progress: item not found")
	ErrBlocked      = errors.New("progress: previous modules not completed")
)
