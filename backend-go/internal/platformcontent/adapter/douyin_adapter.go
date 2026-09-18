package adapter

import (
	"errors"
	"strings"
	"unicode/utf8"
)

type DouyinAdapter struct{}

func NewDouyinAdapter() *DouyinAdapter {
	return &DouyinAdapter{}
}

func (a *DouyinAdapter) Platform() string {
	return "douyin"
}

func (a *DouyinAdapter) TemplateCode() string {
	return "platform.douyin.script.v1"
}

func (a *DouyinAdapter) Validate(result *PlatformContentResult) error {
	if result == nil {
		return errors.New("result cannot be nil")
	}
	if strings.TrimSpace(result.Title) == "" {
		return errors.New("douyin video title cannot be empty")
	}
	if utf8.RuneCountInString(result.Title) > 55 {
		return errors.New("douyin video title exceeds 55 characters limit")
	}
	if strings.TrimSpace(result.Body) == "" {
		return errors.New("douyin video script cannot be empty")
	}
	return nil
}

func (a *DouyinAdapter) Normalize(rawOutput string) (*PlatformContentResult, error) {
	lines := strings.Split(strings.TrimSpace(rawOutput), "\n")
	if len(lines) == 0 {
		return nil, errors.New("empty output from model")
	}

	title := "短视频脚本"
	var bodyLines []string

	for i, l := range lines {
		trimmed := strings.TrimSpace(l)
		if i == 0 && (strings.HasPrefix(trimmed, "标题：") || strings.HasPrefix(trimmed, "【标题】")) {
			title = strings.TrimPrefix(trimmed, "标题：")
			title = strings.TrimPrefix(title, "【标题】")
		} else {
			bodyLines = append(bodyLines, l)
		}
	}

	return &PlatformContentResult{
		Title: strings.TrimSpace(title),
		Body:  strings.Join(bodyLines, "\n"),
	}, nil
}
