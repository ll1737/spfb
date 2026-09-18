package service

import (
	"testing"

	"zhiyu-backend/internal/domain"
)

func TestValidateAccountSessionRejectsEmptyCredentials(t *testing.T) {
	if err := ValidateAccountSession(&domain.Account{}); err == nil {
		t.Fatal("expected empty account credentials to be rejected")
	}
}

func TestValidateAccountSessionAcceptsImportedCookieData(t *testing.T) {
	account := &domain.Account{CookieData: "sid=real-session"}
	if err := ValidateAccountSession(account); err != nil {
		t.Fatalf("expected imported cookie data to be accepted: %v", err)
	}
}

func TestExtractWorkerSessionRejectsLoggedInWithoutCredential(t *testing.T) {
	_, err := ExtractWorkerSession(map[string]interface{}{"isLoggedIn": true, "nickname": "真实账号"})
	if err == nil {
		t.Fatal("expected worker login without encrypted session to be rejected")
	}
}

func TestExtractWorkerSessionAcceptsEncryptedCredential(t *testing.T) {
	session, err := ExtractWorkerSession(map[string]interface{}{"isLoggedIn": true, "encryptedSession": "encrypted-real-session"})
	if err != nil {
		t.Fatalf("expected real encrypted session: %v", err)
	}
	if session != "encrypted-real-session" {
		t.Fatalf("unexpected session: %q", session)
	}
}
