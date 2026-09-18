package adapter

import (
	"fmt"
	"zhiyu-backend/internal/domain"
)

// PlatformContentInput contains necessary context for adapting master content to a specific platform
type PlatformContentInput struct {
	Platform    string
	MasterTitle string
	MasterHook  string
	MasterBody  string
	MasterCTA   string
	AIContext   *domain.CreatorAIContext
}

// PlatformContentResult is the normalized result of platform adaptation
type PlatformContentResult struct {
	Title         string   `json:"title"`
	Body          string   `json:"body"`
	Hashtags      []string `json:"hashtags"`
	CoverImageTip string   `json:"coverImageTip,omitempty"`
}

// ContentAdapter interface for each social platform
type ContentAdapter interface {
	Platform() string
	TemplateCode() string
	Validate(result *PlatformContentResult) error
	Normalize(rawOutput string) (*PlatformContentResult, error)
}

// AdapterRegistry manages all registered platform adapters
type AdapterRegistry struct {
	adapters map[string]ContentAdapter
}

func NewAdapterRegistry() *AdapterRegistry {
	r := &AdapterRegistry{adapters: make(map[string]ContentAdapter)}
	r.Register(NewXHSAdapter())
	r.Register(NewDouyinAdapter())
	r.Register(NewWechatChannelAdapter())
	return r
}

func (r *AdapterRegistry) Register(a ContentAdapter) {
	r.adapters[a.Platform()] = a
}

func (r *AdapterRegistry) Get(platform string) (ContentAdapter, error) {
	a, ok := r.adapters[platform]
	if !ok {
		return nil, fmt.Errorf("platform adapter '%s' not supported", platform)
	}
	return a, nil
}
