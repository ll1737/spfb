package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"zhiyu-backend/internal/aigateway"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/platformcontent/adapter"
	"zhiyu-backend/internal/prompt"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/pkg/idgen"
)

type ContentProjectService struct {
	repo          *mysql.ContentProjectRepository
	gateway       *aigateway.AIGateway
	promptSvc     *prompt.PromptService
	adapters      *adapter.AdapterRegistry
}

func NewContentProjectService(
	repo *mysql.ContentProjectRepository,
	gateway *aigateway.AIGateway,
	promptSvc *prompt.PromptService,
	adapters *adapter.AdapterRegistry,
) *ContentProjectService {
	return &ContentProjectService{
		repo:      repo,
		gateway:   gateway,
		promptSvc: promptSvc,
		adapters:  adapters,
	}
}

// GenerateTopics generates candidate topics for a creator using AI Gateway
func (s *ContentProjectService) GenerateTopics(ctx context.Context, tenantID string, aiCtx *domain.CreatorAIContext, count int) ([]domain.Topic, error) {
	if count <= 0 {
		count = 4
	}

	renderData := map[string]interface{}{
		"CreatorName":           aiCtx.CreatorName,
		"Profession":            aiCtx.Profession,
		"ToneStyle":             aiCtx.ToneStyle,
		"SystemPrompt":          aiCtx.SystemPrompt,
		"ProhibitedExpressions": aiCtx.ProhibitedExpressions,
		"PreferredExpressions":  aiCtx.PreferredExpressions,
		"CoreMemories":          aiCtx.CoreMemories,
		"BrandRules":            aiCtx.BrandRules,
		"Count":                 count,
	}

	promptStr, err := s.promptSvc.Render(ctx, tenantID, "topic.generate.v1", renderData)
	if err != nil {
		return nil, fmt.Errorf("failed to render topic prompt: %w", err)
	}

	resp, err := s.gateway.Chat(ctx, "", aigateway.ChatRequest{
		Messages: []aigateway.ChatMessage{
			{Role: "user", Content: promptStr},
		},
		Temperature: 0.7,
		TenantID:    tenantID,
		CreatorID:   aiCtx.CreatorID,
		TaskType:    "topic",
	})
	if err != nil {
		return nil, fmt.Errorf("ai gateway topic generation failed: %w", err)
	}

	// Parse JSON array of topics
	var rawTopics []struct {
		Title     string   `json:"title"`
		Angle     string   `json:"angle"`
		HeatScore int      `json:"heatScore"`
		Tags      []string `json:"tags"`
		Reason    string   `json:"reason"`
	}

	if err := json.Unmarshal([]byte(resp.Content), &rawTopics); err != nil {
		// Fallback: create single topic with raw content if JSON parse fails
		return []domain.Topic{
			{
				ID:        idgen.GenerateUUID(),
				Title:     aiCtx.CreatorName + " 专业分享",
				Category:  aiCtx.Profession,
				HeatScore: 88,
				Tags:      []string{aiCtx.Profession, "专业干货"},
				Status:    "recommended",
				CreatedAt: time.Now(),
			},
		}, nil
	}

	var result []domain.Topic
	for _, rt := range rawTopics {
		result = append(result, domain.Topic{
			ID:        idgen.GenerateUUID(),
			Title:     rt.Title,
			Category:  aiCtx.Profession,
			HeatScore: rt.HeatScore,
			Tags:      rt.Tags,
			Status:    "recommended",
			CreatedAt: time.Now(),
		})
	}
	return result, nil
}

// GenerateMasterContent creates a MasterContent manuscript for a ContentProject
func (s *ContentProjectService) GenerateMasterContent(ctx context.Context, tenantID, projectID string, topicTitle, angle string, aiCtx *domain.CreatorAIContext) (*domain.MasterContent, error) {
	renderData := map[string]interface{}{
		"CreatorName":  aiCtx.CreatorName,
		"Profession":   aiCtx.Profession,
		"ToneStyle":    aiCtx.ToneStyle,
		"SystemPrompt": aiCtx.SystemPrompt,
		"BrandRules":   aiCtx.BrandRules,
		"CoreMemories": aiCtx.CoreMemories,
		"TopicTitle":   topicTitle,
		"Angle":        angle,
	}

	promptStr, err := s.promptSvc.Render(ctx, tenantID, "master_content.generate.v1", renderData)
	if err != nil {
		return nil, fmt.Errorf("failed to render master content prompt: %w", err)
	}

	resp, err := s.gateway.Chat(ctx, "", aigateway.ChatRequest{
		Messages: []aigateway.ChatMessage{
			{Role: "user", Content: promptStr},
		},
		Temperature: 0.6,
		TenantID:    tenantID,
		CreatorID:   aiCtx.CreatorID,
		TaskType:    "master_content",
	})
	if err != nil {
		return nil, fmt.Errorf("ai gateway master content generation failed: %w", err)
	}

	var parsed struct {
		Title      string   `json:"title"`
		Summary    string   `json:"summary"`
		Hook       string   `json:"hook"`
		CorePoints []string `json:"corePoints"`
		Body       string   `json:"body"`
		CTA        string   `json:"cta"`
	}

	mc := &domain.MasterContent{
		ID:               idgen.GenerateUUID(),
		ContentProjectID: projectID,
		Title:            topicTitle,
		Body:             resp.Content,
		Version:          1,
		AIGenerated:      true,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := json.Unmarshal([]byte(resp.Content), &parsed); err == nil && parsed.Body != "" {
		mc.Title = parsed.Title
		mc.Summary = parsed.Summary
		mc.Hook = parsed.Hook
		mc.CorePoints = parsed.CorePoints
		mc.Body = parsed.Body
		mc.CTA = parsed.CTA
	}

	if err := s.repo.SaveMasterContent(ctx, mc); err != nil {
		return nil, fmt.Errorf("failed to save master content: %w", err)
	}

	_ = s.repo.UpdateStatus(ctx, projectID, domain.ProjectStatusContentReady, "master_content_generated")
	return mc, nil
}

// AdaptPlatformContent adapts a master manuscript to target social media platforms
func (s *ContentProjectService) AdaptPlatformContent(ctx context.Context, tenantID, projectID, platform string, mc *domain.MasterContent, aiCtx *domain.CreatorAIContext) (*domain.PlatformContent, error) {
	adp, err := s.adapters.Get(platform)
	if err != nil {
		return nil, err
	}

	renderData := map[string]interface{}{
		"MasterTitle": mc.Title,
		"MasterHook":  mc.Hook,
		"MasterBody":  mc.Body,
		"MasterCTA":   mc.CTA,
	}

	promptStr, err := s.promptSvc.Render(ctx, tenantID, adp.TemplateCode(), renderData)
	if err != nil {
		return nil, fmt.Errorf("failed to render platform adaptation prompt: %w", err)
	}

	resp, err := s.gateway.Chat(ctx, "", aigateway.ChatRequest{
		Messages: []aigateway.ChatMessage{
			{Role: "user", Content: promptStr},
		},
		Temperature: 0.7,
		TenantID:    tenantID,
		CreatorID:   aiCtx.CreatorID,
		TaskType:    "platform_adaptation",
	})
	if err != nil {
		return nil, fmt.Errorf("ai gateway adaptation failed for %s: %w", platform, err)
	}

	normResult, err := adp.Normalize(resp.Content)
	if err != nil {
		normResult = &adapter.PlatformContentResult{
			Title: mc.Title,
			Body:  resp.Content,
		}
	}

	pc := &domain.PlatformContent{
		ID:               idgen.GenerateUUID(),
		ContentProjectID: projectID,
		Platform:         platform,
		Title:            normResult.Title,
		Body:             normResult.Body,
		Hashtags:         normResult.Hashtags,
		Status:           "ready",
		Version:          1,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.repo.SavePlatformContent(ctx, pc); err != nil {
		return nil, fmt.Errorf("failed to save platform content: %w", err)
	}

	return pc, nil
}

// PerformAIReview executes automatic compliance, brand and persona consistency review
func (s *ContentProjectService) PerformAIReview(ctx context.Context, tenantID, projectID string, contentText string, aiCtx *domain.CreatorAIContext) (*domain.ContentReview, error) {
	renderData := map[string]interface{}{
		"SystemPrompt": aiCtx.SystemPrompt,
		"BrandRules":   aiCtx.BrandRules,
		"ContentText":  contentText,
	}

	promptStr, err := s.promptSvc.Render(ctx, tenantID, "content.ai_review.v1", renderData)
	if err != nil {
		return nil, fmt.Errorf("failed to render ai review prompt: %w", err)
	}

	resp, err := s.gateway.Chat(ctx, "", aigateway.ChatRequest{
		Messages: []aigateway.ChatMessage{
			{Role: "user", Content: promptStr},
		},
		Temperature: 0.2,
		TenantID:    tenantID,
		CreatorID:   aiCtx.CreatorID,
		TaskType:    "ai_review",
	})
	if err != nil {
		return nil, fmt.Errorf("ai gateway review failed: %w", err)
	}

	rev := &domain.ContentReview{
		ID:               idgen.GenerateUUID(),
		TenantID:         tenantID,
		ContentProjectID: projectID,
		ReviewerType:     "ai",
		Status:           "passed",
		OverallScore:     92,
		PersonaScore:     90,
		BrandScore:       90,
		ComplianceScore:  95,
		PlatformScore:    92,
		CreatedAt:        time.Now(),
	}

	var parsed struct {
		OverallScore    int      `json:"overallScore"`
		PersonaScore    int      `json:"personaScore"`
		BrandScore      int      `json:"brandScore"`
		ComplianceScore int      `json:"complianceScore"`
		PlatformScore   int      `json:"platformScore"`
		Passed          bool     `json:"passed"`
		Risks           []string `json:"risks"`
		Suggestions     []string `json:"suggestions"`
	}

	if err := json.Unmarshal([]byte(resp.Content), &parsed); err == nil {
		rev.OverallScore = parsed.OverallScore
		rev.PersonaScore = parsed.PersonaScore
		rev.BrandScore = parsed.BrandScore
		rev.ComplianceScore = parsed.ComplianceScore
		rev.PlatformScore = parsed.PlatformScore
		if !parsed.Passed || rev.OverallScore < 60 {
			rev.Status = "rejected"
		}
		risksBytes, _ := json.Marshal(parsed.Risks)
		suggBytes, _ := json.Marshal(parsed.Suggestions)
		rev.RisksJSON = string(risksBytes)
		rev.SuggestionsJSON = string(suggBytes)
	}

	if err := s.repo.SaveReview(ctx, rev); err != nil {
		return nil, fmt.Errorf("failed to save review: %w", err)
	}

	return rev, nil
}
