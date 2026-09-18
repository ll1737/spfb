package aigateway

import (
	"context"
	"fmt"
	"sync"
)

// AIGateway manages multiple LLM providers and routes requests
type AIGateway struct {
	mu        sync.RWMutex
	providers map[string]LLMProvider
	defaultPr string
}

func NewAIGateway() *AIGateway {
	return &AIGateway{
		providers: make(map[string]LLMProvider),
	}
}

// RegisterProvider registers a provider by name
func (g *AIGateway) RegisterProvider(name string, p LLMProvider, isDefault bool) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.providers[name] = p
	if isDefault || g.defaultPr == "" {
		g.defaultPr = name
	}
}

// GetProvider retrieves a provider or the default provider
func (g *AIGateway) GetProvider(name string) (LLMProvider, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if name == "" {
		name = g.defaultPr
	}

	p, ok := g.providers[name]
	if !ok {
		return nil, fmt.Errorf("provider '%s' not registered", name)
	}
	return p, nil
}

// Chat sends a chat request to the specified or default provider
func (g *AIGateway) Chat(ctx context.Context, providerName string, req ChatRequest) (*ChatResponse, error) {
	p, err := g.GetProvider(providerName)
	if err != nil {
		return nil, err
	}
	return p.Chat(ctx, req)
}

// StreamChat starts a streaming chat with the specified provider
func (g *AIGateway) StreamChat(ctx context.Context, providerName string, req ChatRequest) (<-chan StreamChunk, error) {
	p, err := g.GetProvider(providerName)
	if err != nil {
		return nil, err
	}
	return p.StreamChat(ctx, req)
}
