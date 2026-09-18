package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"zhiyu-backend/internal/aigateway"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/platformcontent/adapter"
	"zhiyu-backend/internal/prompt"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/pkg/idgen"
)

type ContentProjectService struct {
	repo      *mysql.ContentProjectRepository
	gateway   *aigateway.AIGateway
	promptSvc *prompt.PromptService
	adapters  *adapter.AdapterRegistry
}

type CreateContentProjectInput struct {
	TopicID     string `json:"topicId"`
	SeriesID    string `json:"seriesId"`
	Title       string `json:"title"`
	ContentType string `json:"contentType"`
}

type AIReviewResult struct {
	OverallScore    int      `json:"overallScore"`
	PersonaScore    int      `json:"personaScore"`
	BrandScore      int      `json:"brandScore"`
	ComplianceScore int      `json:"complianceScore"`
	PlatformScore   int      `json:"platformScore"`
	Passed          bool     `json:"passed"`
	Risks           []string `json:"risks"`
	Suggestions     []string `json:"suggestions"`
}

func ParseGeneratedTopics(content string) ([]domain.Topic, error) {
	var rawTopics []struct {
		Title     string   `json:"title"`
		Angle     string   `json:"angle"`
		HeatScore int      `json:"heatScore"`
		Tags      []string `json:"tags"`
		Reason    string   `json:"reason"`
	}
	if err := json.Unmarshal([]byte(content), &rawTopics); err != nil {
		return nil, fmt.Errorf("AI 选题输出不是有效 JSON: %w", err)
	}
	if len(rawTopics) == 0 {
		return nil, fmt.Errorf("AI 未返回任何选题")
	}
	now := time.Now()
	result := make([]domain.Topic, 0, len(rawTopics))
	for _, row := range rawTopics {
		if strings.TrimSpace(row.Title) == "" {
			return nil, fmt.Errorf("AI 选题缺少标题")
		}
		angles := make([]string, 0, 1)
		if strings.TrimSpace(row.Angle) != "" {
			angles = append(angles, row.Angle)
		}
		result = append(result, domain.Topic{
			ID:        idgen.GenerateUUID(),
			Title:     strings.TrimSpace(row.Title),
			HeatScore: row.HeatScore,
			Tags:      row.Tags,
			Angles:    angles,
			Status:    "recommended",
			CreatedAt: now,
			UpdatedAt: now,
		})
	}
	return result, nil
}

func ParseAIReview(content string) (*AIReviewResult, error) {
	var result AIReviewResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return nil, fmt.Errorf("AI 审核输出不是有效 JSON: %w", err)
	}
	if result.OverallScore < 0 || result.OverallScore > 100 {
		return nil, fmt.Errorf("AI 审核总分不在有效范围")
	}
	return &result, nil
}

func NewContentProject(tenantID, brandID, creatorID, userID string, input CreateContentProjectInput) (*domain.ContentProject, error) {
	if strings.TrimSpace(tenantID) == "" {
		return nil, fmt.Errorf("企业空间未初始化")
	}
	if strings.TrimSpace(creatorID) == "" {
		return nil, fmt.Errorf("必须选择 Creator")
	}
	if strings.TrimSpace(input.Title) == "" {
		return nil, fmt.Errorf("内容项目标题不能为空")
	}
	contentType := input.ContentType
	if contentType == "" {
		contentType = "article"
	}
	now := time.Now()
	return &domain.ContentProject{
		ID:          idgen.GenerateUUID(),
		TenantID:    tenantID,
		BrandID:     brandID,
		CreatorID:   creatorID,
		TopicID:     input.TopicID,
		SeriesID:    input.SeriesID,
		Title:       strings.TrimSpace(input.Title),
		ContentType: contentType,
		Status:      domain.ProjectStatusDraft,
		CurrentStep: "init",
		CreatedBy:   userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
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

func (s *ContentProjectService) CreateProject(ctx context.Context, tenantID, brandID, creatorID, userID string, input CreateContentProjectInput) (*domain.ContentProject, error) {
	project, err := NewContentProject(tenantID, brandID, creatorID, userID, input)
	if err != nil {
		return nil, err
	}
	if err := s.repo.CreateProject(ctx, project); err != nil {
		return nil, err
	}
	return project, nil
}

func (s *ContentProjectService) ListProjects(ctx context.Context, tenantID, creatorID string, limit, offset int) ([]domain.ContentProject, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.ListProjects(ctx, tenantID, creatorID, limit, offset)
}

func (s *ContentProjectService) GetProject(ctx context.Context, tenantID, projectID string) (*domain.ContentProject, error) {
	return s.repo.GetProjectByID(ctx, tenantID, projectID)
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

	result, err := ParseGeneratedTopics(resp.Content)
	if err != nil {
		return nil, err
	}
	for i := range result {
		result[i].Category = aiCtx.Profession
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

	parsed, err := ParseAIReview(resp.Content)
	if err != nil {
		return nil, err
	}
	status := "passed"
	if !parsed.Passed || parsed.OverallScore < 60 {
		status = "rejected"
	}
	risksBytes, _ := json.Marshal(parsed.Risks)
	suggBytes, _ := json.Marshal(parsed.Suggestions)
	rev := &domain.ContentReview{
		ID:               idgen.GenerateUUID(),
		TenantID:         tenantID,
		ContentProjectID: projectID,
		ReviewerType:     "ai",
		Status:           status,
		OverallScore:     parsed.OverallScore,
		PersonaScore:     parsed.PersonaScore,
		BrandScore:       parsed.BrandScore,
		ComplianceScore:  parsed.ComplianceScore,
		PlatformScore:    parsed.PlatformScore,
		RisksJSON:        string(risksBytes),
		SuggestionsJSON:  string(suggBytes),
		CreatedAt:        time.Now(),
	}

	if err := s.repo.SaveReview(ctx, rev); err != nil {
		return nil, fmt.Errorf("failed to save review: %w", err)
	}

	return rev, nil
}
