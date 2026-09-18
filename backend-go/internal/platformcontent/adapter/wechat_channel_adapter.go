package adapter

import (
	"errors"
	"strings"
	"unicode/utf8"
)

type WechatChannelAdapter struct{}

func NewWechatChannelAdapter() *WechatChannelAdapter {
	return &WechatChannelAdapter{}
}

func (a *WechatChannelAdapter) Platform() string {
	return "wechat_channel"
}

func (a *WechatChannelAdapter) TemplateCode() string {
	return "platform.douyin.script.v1" // Shares high quality video script structure
}

func (a *WechatChannelAdapter) Validate(result *PlatformContentResult) error {
	if result == nil {
		return errors.New("result cannot be nil")
	}
	if strings.TrimSpace(result.Title) == "" {
		return errors.New("wechat channel video title cannot be empty")
	}
	if utf8.RuneCountInString(result.Title) > 60 {
		return errors.New("wechat channel video title exceeds 60 characters limit")
	}
	return nil
}

func (a *WechatChannelAdapter) Normalize(rawOutput string) (*PlatformContentResult, error) {
	lines := strings.Split(strings.TrimSpace(rawOutput), "\n")
	if len(lines) == 0 {
		return nil, errors.New("empty output from model")
	}

	title := "视频号文案"
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
