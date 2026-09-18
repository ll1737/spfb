package service

import (
	"errors"
	"strings"

	"zhiyu-backend/internal/domain"
)

func ValidateTopic(topic *domain.Topic) error {
	if topic == nil || strings.TrimSpace(topic.Title) == "" {
		return errors.New("选题标题不能为空")
	}
	if len([]rune(strings.TrimSpace(topic.Title))) > 256 {
		return errors.New("选题标题不能超过 256 个字符")
	}
	return nil
}
