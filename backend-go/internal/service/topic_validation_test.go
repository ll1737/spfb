package service

import (
	"testing"

	"zhiyu-backend/internal/domain"
)

func TestValidateTopicRequiresTitle(t *testing.T) {
	if err := ValidateTopic(&domain.Topic{}); err == nil {
		t.Fatal("expected empty topic title to be rejected")
	}
}
