package creator

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/idgen"
)

type Repository interface {
	List(ctx context.Context, tenantID, brandID string) ([]domain.Creator, error)
	Get(ctx context.Context, tenantID, creatorID string) (*domain.Creator, error)
	Create(ctx context.Context, creator *domain.Creator) error
	Update(ctx context.Context, creator *domain.Creator) error
	Delete(ctx context.Context, tenantID, creatorID string) error
	LoadOpsCounts(ctx context.Context, tenantID string, creatorIDs []string) (map[string]OpsCounts, error)
	ListPlans(ctx context.Context, tenantID, creatorID string) ([]domain.CreatorPlan, error)
	SavePlan(ctx context.Context, plan *domain.CreatorPlan) error
}

type Service struct {
	repository Repository
	newID      func() string
}

type PersonaInput struct {
	ToneStyle             string `json:"toneStyle"`
	SystemPrompt          string `json:"systemPrompt"`
	KnowledgeBase         string `json:"knowledgeBase"`
	TargetAudience        string `json:"targetAudience"`
	ProhibitedExpressions string `json:"prohibitedExpressions"`
	PreferredExpressions  string `json:"preferredExpressions"`
	CTAStyle              string `json:"ctaStyle"`
}

type CreateInput struct {
	Name            string       `json:"name"`
	Avatar          string       `json:"avatar"`
	Type            string       `json:"type"`
	Industry        string       `json:"industry"`
	Profession      string       `json:"profession"`
	Intro           string       `json:"intro"`
	ProductionMode  string       `json:"productionMode"`
	DailyTarget     int          `json:"dailyTarget"`
	DefaultTimezone string       `json:"defaultTimezone"`
	Persona         PersonaInput `json:"persona"`
}

type UpdateInput struct {
	Name            string       `json:"name"`
	Avatar          string       `json:"avatar"`
	Type            string       `json:"type"`
	Industry        string       `json:"industry"`
	Profession      string       `json:"profession"`
	Intro           string       `json:"intro"`
	Status          string       `json:"status"`
	ProductionMode  string       `json:"productionMode"`
	DailyTarget     int          `json:"dailyTarget"`
	DefaultTimezone string       `json:"defaultTimezone"`
	Persona         PersonaInput `json:"persona"`
}

type PlanPlatformInput struct {
	Platform     string   `json:"platform"`
	AccountID    string   `json:"accountId"`
	DailyCount   int      `json:"dailyCount"`
	PublishTimes []string `json:"publishTimes"`
}

type PlanInput struct {
	ID             string              `json:"id"`
	PlanType       string              `json:"planType"`
	StartDate      string              `json:"startDate"`
	EndDate        string              `json:"endDate"`
	DailyTarget    int                 `json:"dailyTarget"`
	ProductionMode string              `json:"productionMode"`
	Status         string              `json:"status"`
	Platforms      []PlanPlatformInput `json:"platforms"`
}

func NewService(repository Repository, newID func() string) *Service {
	if newID == nil {
		newID = idgen.GenerateUUID
	}
	return &Service{repository: repository, newID: newID}
}

func (s *Service) List(ctx context.Context, tenantID, brandID string) ([]domain.Creator, error) {
	if strings.TrimSpace(tenantID) == "" {
		return []domain.Creator{}, nil
	}
	return s.repository.List(ctx, tenantID, brandID)
}

func (s *Service) ListOpsSummaries(ctx context.Context, tenantID, brandID string) ([]OpsSummary, error) {
	creators, err := s.List(ctx, tenantID, brandID)
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(creators))
	for _, value := range creators {
		ids = append(ids, value.ID)
	}
	counts, err := s.repository.LoadOpsCounts(ctx, tenantID, ids)
	if err != nil {
		return nil, err
	}
	result := make([]OpsSummary, 0, len(creators))
	for _, value := range creators {
		result = append(result, BuildOpsSummary(value, counts[value.ID]))
	}
	return result, nil
}

func (s *Service) Get(ctx context.Context, tenantID, creatorID string) (*domain.Creator, error) {
	return s.repository.Get(ctx, tenantID, creatorID)
}

func (s *Service) Create(ctx context.Context, tenantID, brandID, userID string, input CreateInput) (*domain.Creator, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, errors.New("创作者名称不能为空")
	}
	if strings.TrimSpace(tenantID) == "" {
		return nil, errors.New("企业空间未初始化")
	}

	now := time.Now()
	creatorID := "creator_" + s.newID()
	creatorType := input.Type
	if creatorType == "" {
		creatorType = "expert"
	}
	productionMode := input.ProductionMode
	if productionMode == "" {
		productionMode = "manual"
	}
	dailyTarget := input.DailyTarget
	if dailyTarget <= 0 {
		dailyTarget = 2
	}
	timezone := input.DefaultTimezone
	if timezone == "" {
		timezone = "Asia/Shanghai"
	}

	value := &domain.Creator{
		ID:              creatorID,
		TenantID:        tenantID,
		BrandID:         brandID,
		Name:            name,
		Avatar:          input.Avatar,
		Type:            creatorType,
		Industry:        input.Industry,
		Profession:      input.Profession,
		Intro:           input.Intro,
		Status:          "active",
		ProductionMode:  productionMode,
		DailyTarget:     dailyTarget,
		DefaultTimezone: timezone,
		CreatedBy:       userID,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	value.Persona = &domain.CreatorPersona{
		ID:                    "persona_" + s.newID(),
		TenantID:              tenantID,
		OrgID:                 tenantID,
		BrandID:               brandID,
		CreatorID:             creatorID,
		Name:                  name,
		Avatar:                input.Avatar,
		Title:                 input.Profession,
		Domain:                input.Industry,
		ToneStyle:             input.Persona.ToneStyle,
		SystemPrompt:          input.Persona.SystemPrompt,
		KnowledgeBase:         input.Persona.KnowledgeBase,
		TargetAudience:        input.Persona.TargetAudience,
		ProhibitedExpressions: input.Persona.ProhibitedExpressions,
		PreferredExpressions:  input.Persona.PreferredExpressions,
		CTAStyle:              input.Persona.CTAStyle,
		Version:               1,
		Status:                "active",
		CreatedAt:             now,
		UpdatedAt:             now,
	}
	if err := s.repository.Create(ctx, value); err != nil {
		return nil, err
	}
	return value, nil
}

func (s *Service) Delete(ctx context.Context, tenantID, creatorID string) error {
	return s.repository.Delete(ctx, tenantID, creatorID)
}

func (s *Service) Update(ctx context.Context, tenantID, creatorID string, input UpdateInput) (*domain.Creator, error) {
	value, err := s.repository.Get(ctx, tenantID, creatorID)
	if err != nil {
		return nil, err
	}
	if value == nil {
		return nil, errors.New("创作者不存在或无权访问")
	}
	if strings.TrimSpace(input.Name) != "" {
		value.Name = strings.TrimSpace(input.Name)
	}
	if input.Avatar != "" {
		value.Avatar = input.Avatar
	}
	if input.Type != "" {
		value.Type = input.Type
	}
	if input.Industry != "" {
		value.Industry = input.Industry
	}
	if input.Profession != "" {
		value.Profession = input.Profession
	}
	if input.Intro != "" {
		value.Intro = input.Intro
	}
	if input.Status != "" {
		value.Status = input.Status
	}
	if input.ProductionMode != "" {
		value.ProductionMode = input.ProductionMode
	}
	if input.DailyTarget > 0 {
		value.DailyTarget = input.DailyTarget
	}
	if input.DefaultTimezone != "" {
		value.DefaultTimezone = input.DefaultTimezone
	}
	if value.Persona == nil {
		value.Persona = &domain.CreatorPersona{
			ID:        "persona_" + s.newID(),
			TenantID:  value.TenantID,
			OrgID:     value.TenantID,
			BrandID:   value.BrandID,
			CreatorID: value.ID,
			Name:      value.Name,
			Version:   1,
			Status:    "active",
			CreatedAt: time.Now(),
		}
	}
	value.Persona.Name = value.Name
	value.Persona.Avatar = value.Avatar
	value.Persona.Title = value.Profession
	value.Persona.Domain = value.Industry
	if input.Persona.ToneStyle != "" {
		value.Persona.ToneStyle = input.Persona.ToneStyle
	}
	if input.Persona.SystemPrompt != "" {
		value.Persona.SystemPrompt = input.Persona.SystemPrompt
	}
	if input.Persona.KnowledgeBase != "" {
		value.Persona.KnowledgeBase = input.Persona.KnowledgeBase
	}
	if input.Persona.TargetAudience != "" {
		value.Persona.TargetAudience = input.Persona.TargetAudience
	}
	if input.Persona.ProhibitedExpressions != "" {
		value.Persona.ProhibitedExpressions = input.Persona.ProhibitedExpressions
	}
	if input.Persona.PreferredExpressions != "" {
		value.Persona.PreferredExpressions = input.Persona.PreferredExpressions
	}
	if input.Persona.CTAStyle != "" {
		value.Persona.CTAStyle = input.Persona.CTAStyle
	}
	now := time.Now()
	value.UpdatedAt = now
	value.Persona.UpdatedAt = now
	if err := s.repository.Update(ctx, value); err != nil {
		return nil, err
	}
	return value, nil
}

func (s *Service) BuildAIContext(ctx context.Context, tenantID, creatorID string) (*domain.CreatorAIContext, error) {
	value, err := s.repository.Get(ctx, tenantID, creatorID)
	if err != nil {
		return nil, err
	}
	if value == nil {
		return nil, errors.New("创作者不存在或无权访问")
	}
	result := &domain.CreatorAIContext{
		CreatorID:   value.ID,
		CreatorName: value.Name,
		Profession:  value.Profession,
	}
	if value.Persona != nil {
		result.ToneStyle = value.Persona.ToneStyle
		result.SystemPrompt = value.Persona.SystemPrompt
		result.ProhibitedExpressions = splitExpressions(value.Persona.ProhibitedExpressions)
		result.PreferredExpressions = splitExpressions(value.Persona.PreferredExpressions)
		if strings.TrimSpace(value.Persona.KnowledgeBase) != "" {
			result.KnowledgeSnippets = []string{value.Persona.KnowledgeBase}
		}
	}
	return result, nil
}

func (s *Service) ListPlans(ctx context.Context, tenantID, creatorID string) ([]domain.CreatorPlan, error) {
	if _, err := s.repository.Get(ctx, tenantID, creatorID); err != nil {
		return nil, err
	}
	return s.repository.ListPlans(ctx, tenantID, creatorID)
}

func (s *Service) SavePlan(ctx context.Context, tenantID, creatorID string, input PlanInput) (*domain.CreatorPlan, error) {
	if input.DailyTarget <= 0 || input.DailyTarget > 100 {
		return nil, errors.New("每日发布篇数必须在 1 到 100 之间")
	}
	if _, err := s.repository.Get(ctx, tenantID, creatorID); err != nil {
		return nil, err
	}
	now := time.Now()
	planID := input.ID
	if planID == "" {
		planID = "creator_plan_" + s.newID()
	}
	planType := input.PlanType
	if planType == "" {
		planType = "daily"
	}
	productionMode := input.ProductionMode
	if productionMode == "" {
		productionMode = "manual"
	}
	status := input.Status
	if status == "" {
		status = "active"
	}
	plan := &domain.CreatorPlan{
		ID:             planID,
		TenantID:       tenantID,
		CreatorID:      creatorID,
		PlanType:       planType,
		StartDate:      input.StartDate,
		EndDate:        input.EndDate,
		DailyTarget:    input.DailyTarget,
		ProductionMode: productionMode,
		Status:         status,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	for _, platform := range input.Platforms {
		publishTimes, _ := json.Marshal(platform.PublishTimes)
		plan.Platforms = append(plan.Platforms, domain.CreatorPlanPlatform{
			PlanID:           planID,
			Platform:         platform.Platform,
			AccountID:        platform.AccountID,
			DailyCount:       platform.DailyCount,
			PublishTimesJSON: string(publishTimes),
			PublishTimes:     platform.PublishTimes,
			CreatedAt:        now,
			UpdatedAt:        now,
		})
	}
	if err := s.repository.SavePlan(ctx, plan); err != nil {
		return nil, err
	}
	return plan, nil
}

func splitExpressions(value string) []string {
	parts := strings.FieldsFunc(value, func(r rune) bool {
		return r == ',' || r == '，' || r == '\n' || r == ';' || r == '；'
	})
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
