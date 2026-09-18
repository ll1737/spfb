package service

import (
	"testing"

	"zhiyu-backend/internal/domain"
)

func TestValidateContentPackageRequiresMasterContent(t *testing.T) {
	if err := ValidateContentPackage(&domain.ContentPackage{Title: "只有标题"}); err == nil {
		t.Fatal("expected missing master content to be rejected")
	}
}
