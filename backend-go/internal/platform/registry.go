package platform

import (
	"fmt"
	"sync"
)

type PlatformRegistry struct {
	mu        sync.RWMutex
	providers map[string]PlatformProvider
}

func NewPlatformRegistry() *PlatformRegistry {
	return &PlatformRegistry{
		providers: make(map[string]PlatformProvider),
	}
}

func (r *PlatformRegistry) Register(p PlatformProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[p.Platform()] = p
}

func (r *PlatformRegistry) Get(platform string) (PlatformProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.providers[platform]
	if !ok {
		return nil, fmt.Errorf("platform provider '%s' not registered", platform)
	}
	return p, nil
}
