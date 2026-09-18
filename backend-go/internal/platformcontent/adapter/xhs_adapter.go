package adapter

import (
	"errors"
	"regexp"
	"strings"
	"unicode/utf8"
)

type XHSAdapter struct{}

func NewXHSAdapter() *XHSAdapter {
	return &XHSAdapter{}
}

func (a *XHSAdapter) Platform() string {
	return "xiaohongshu"
}

func (a *XHSAdapter) TemplateCode() string {
	return "platform.xhs.rewrite.v1"
}

func (a *XHSAdapter) Validate(result *PlatformContentResult) error {
	if result == nil {
		return errors.New("result cannot be nil")
	}
	if strings.TrimSpace(result.Title) == "" {
		return errors.New("xiaohongshu title cannot be empty")
	}
	if utf8.RuneCountInString(result.Title) > 30 {
		return errors.New("xiaohongshu title exceeds 30 characters limit")
	}
	if strings.TrimSpace(result.Body) == "" {
		return errors.New("xiaohongshu body cannot be empty")
	}
	if utf8.RuneCountInString(result.Body) > 1000 {
		return errors.New("xiaohongshu body exceeds 1000 characters limit")
	}
	return nil
}

func (a *XHSAdapter) Normalize(rawOutput string) (*PlatformContentResult, error) {
	lines := strings.Split(strings.TrimSpace(rawOutput), "\n")
	if len(lines) == 0 {
		return nil, errors.New("empty output from model")
	}

	title := ""
	var bodyLines []string
	var hashtags []string

	// Extract hashtags (#xxx)
	reTag := regexp.MustCompile(`#([^\s#]+)`)
	matches := reTag.FindAllString(rawOutput, -1)
	for _, m := range matches {
		hashtags = append(hashtags, m)
	}

	for i, l := range lines {
		trimmed := strings.TrimSpace(l)
		if i == 0 && (strings.HasPrefix(trimmed, "标题：") || strings.HasPrefix(trimmed, "【标题】") || !strings.Contains(trimmed, "：")) {
			title = strings.TrimPrefix(trimmed, "标题：")
			title = strings.TrimPrefix(title, "【标题】")
			title = strings.TrimSpace(title)
		} else {
			bodyLines = append(bodyLines, l)
		}
	}

	if title == "" && len(bodyLines) > 0 {
		title = bodyLines[0]
		bodyLines = bodyLines[1:]
	}

	body := strings.Join(bodyLines, "\n")
	return &PlatformContentResult{
		Title:    title,
		Body:     body,
		Hashtags: hashtags,
	}, nil
}
