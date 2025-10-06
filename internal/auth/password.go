package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const passwordCost = bcrypt.DefaultCost

// HashPassword renvoie le hash bcrypt du mot de passe donné.
func HashPassword(password string) (string, error) {
	if len(password) < 8 {
		return "", errors.New("password too short: minimum 8 characters")
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), passwordCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

// VerifyPassword compare le hash stocké avec le mot de passe fourni.
func VerifyPassword(hash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
