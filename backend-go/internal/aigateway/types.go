package aigateway

import (
	"context"
	"time"
)

// ChatMessage represents a single turn in a conversation
type ChatMessage struct {
	Role    string `json:"role"` // system | user | assistant
	Content string `json:"content"`
}

// ChatRequest represents a unified request to any LLM
type ChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"maxTokens,omitempty"`
	TopP        float32       `json:"topP,omitempty"`
	Stream      bool          `json:"stream,omitempty"`
	TenantID    string        `json:"tenantId,omitempty"`
	CreatorID   string        `json:"creatorId,omitempty"`
	TaskType    string        `json:"taskType,omitempty"`
}

// ChatResponse represents a unified response from any LLM
type ChatResponse struct {
	Content      string    `json:"content"`
	PromptTokens int       `json:"promptTokens"`
	CompTokens   int       `json:"compTokens"`
	TotalTokens  int       `json:"totalTokens"`
	Model        string    `json:"model"`
	Provider     string    `json:"provider"`
	LatencyMs    int64     `json:"latencyMs"`
	CreatedAt    time.Time `json:"createdAt"`
}

// StreamChunk represents a chunk received during streaming
type StreamChunk struct {
	Delta     string `json:"delta"`
	Done      bool   `json:"done"`
	Error     error  `json:"error,omitempty"`
}

// LLMProvider interface abstracts all model providers
type LLMProvider interface {
	Name() string
	Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error)
	StreamChat(ctx context.Context, req ChatRequest) (<-chan StreamChunk, error)
}
