package service

import (
	"testing"

	"zhiyu-backend/internal/domain"
)

func TestValidateCreatorRequiresName(t *testing.T) {
	if err := ValidateCreator(&domain.CreatorPersona{}); err == nil {
		t.Fatal("expected empty creator name to be rejected")
	}
}

func TestValidateCreatorAcceptsRealCreator(t *testing.T) {
	if err := ValidateCreator(&domain.CreatorPersona{Name: "我的创作者"}); err != nil {
		t.Fatalf("expected creator to be valid: %v", err)
	}
}
