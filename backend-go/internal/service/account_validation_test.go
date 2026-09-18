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
