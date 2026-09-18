package service

import (
	"errors"
	"strings"

	"zhiyu-backend/internal/domain"
)

func ValidateContentPackage(row *domain.ContentPackage) error {
	if row == nil || strings.TrimSpace(row.Title) == "" {
		return errors.New("内容包标题不能为空")
	}
	if strings.TrimSpace(row.MasterContent) == "" {
		return errors.New("母内容不能为空")
	}
	return nil
}
