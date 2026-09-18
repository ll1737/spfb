package service

import (
	"errors"
	"strings"

	"zhiyu-backend/internal/domain"
)

func ValidateCreator(creator *domain.CreatorPersona) error {
	if creator == nil {
		return errors.New("创作者不能为空")
	}
	if strings.TrimSpace(creator.Name) == "" {
		return errors.New("创作者名称不能为空")
	}
	if len([]rune(strings.TrimSpace(creator.Name))) > 128 {
		return errors.New("创作者名称不能超过 128 个字符")
	}
	return nil
}
