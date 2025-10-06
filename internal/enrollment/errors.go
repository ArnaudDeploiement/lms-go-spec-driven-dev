package enrollment

import "errors"

var (
	ErrInvalidInput    = errors.New("enrollment: invalid input")
	ErrNotFound        = errors.New("enrollment: not found")
	ErrAlreadyEnrolled = errors.New("enrollment: user already enrolled")
)
