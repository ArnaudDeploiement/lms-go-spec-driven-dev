package auth

import "testing"

func TestHashAndVerifyPassword(t *testing.T) {
	hash, err := HashPassword("supersecret")
	if err != nil {
		t.Fatalf("hash error: %v", err)
	}
	if hash == "supersecret" {
		t.Fatal("hash should not equal raw password")
	}

	if err := VerifyPassword(hash, "supersecret"); err != nil {
		t.Fatalf("verify error: %v", err)
	}

	if err := VerifyPassword(hash, "wrongpass"); err == nil {
		t.Fatal("expected verification failure with wrong password")
	}
}

func TestHashPasswordTooShort(t *testing.T) {
	if _, err := HashPassword("short"); err == nil {
		t.Fatal("expected error for short password")
	}
}
