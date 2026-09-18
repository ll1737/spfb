package aigateway

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type OpenAICompatibleConfig struct {
	Name       string `json:"name"`        // e.g. "deepseek", "qwen", "openai"
	BaseURL    string `json:"baseUrl"`     // e.g. "https://api.deepseek.com/v1"
	APIKey     string `json:"apiKey"`
	DefaultModel string `json:"defaultModel"` // e.g. "deepseek-chat"
	TimeoutSec int    `json:"timeoutSec"`
}

type OpenAICompatibleProvider struct {
	cfg    OpenAICompatibleConfig
	client *http.Client
}

func NewOpenAICompatibleProvider(cfg OpenAICompatibleConfig) *OpenAICompatibleProvider {
	timeout := 60 * time.Second
	if cfg.TimeoutSec > 0 {
		timeout = time.Duration(cfg.TimeoutSec) * time.Second
	}
	return &OpenAICompatibleProvider{
		cfg: cfg,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

func (p *OpenAICompatibleProvider) Name() string {
	if p.cfg.Name != "" {
		return p.cfg.Name
	}
	return "openai-compatible"
}

type openAIChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream"`
}

type openAIChatResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

func (p *OpenAICompatibleProvider) Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	startTime := time.Now()

	model := req.Model
	if model == "" {
		model = p.cfg.DefaultModel
	}

	bodyPayload := openAIChatRequest{
		Model:       model,
		Messages:    req.Messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      false,
	}

	reqBytes, err := json.Marshal(bodyPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/chat/completions", p.cfg.BaseURL)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	if p.cfg.APIKey != "" {
		httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.cfg.APIKey))
	}

	resp, err := p.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("llm provider returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	var chatResp openAIChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if chatResp.Error != nil {
		return nil, fmt.Errorf("llm error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return nil, fmt.Errorf("no completion choices returned")
	}

	return &ChatResponse{
		Content:      chatResp.Choices[0].Message.Content,
		PromptTokens: chatResp.Usage.PromptTokens,
		CompTokens:   chatResp.Usage.CompletionTokens,
		TotalTokens:  chatResp.Usage.TotalTokens,
		Model:        model,
		Provider:     p.Name(),
		LatencyMs:    time.Since(startTime).Milliseconds(),
		CreatedAt:    time.Now(),
	}, nil
}

func (p *OpenAICompatibleProvider) StreamChat(ctx context.Context, req ChatRequest) (<-chan StreamChunk, error) {
	ch := make(chan StreamChunk, 10)
	go func() {
		defer close(ch)
		// Fallback to sync chat if SSE not explicitly configured
		resp, err := p.Chat(ctx, req)
		if err != nil {
			ch <- StreamChunk{Error: err}
			return
		}
		ch <- StreamChunk{Delta: resp.Content, Done: true}
	}()
	return ch, nil
}
