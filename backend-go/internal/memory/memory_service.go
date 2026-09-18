package memory

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
	"zhiyu-backend/internal/aigateway"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/idgen"
)

type MemoryService struct {
	db        *gorm.DB
	aiGateway *aigateway.AIGateway
}

func NewMemoryService(db *gorm.DB, aiGateway *aigateway.AIGateway) *MemoryService {
	return &MemoryService{
		db:        db,
		aiGateway: aiGateway,
	}
}

// BuildAIContext assembles all persona, long-term memory, brand rules into a unified CreatorAIContext
func (s *MemoryService) BuildAIContext(ctx context.Context, tenantID, creatorID string) (*domain.CreatorAIContext, error) {
	var persona domain.CreatorPersona
	if err := s.db.WithContext(ctx).Where("id = ? OR creator_id = ?", creatorID, creatorID).First(&persona).Error; err != nil {
		// Fallback to default
		persona = domain.CreatorPersona{
			Name:         "行业专业创作者",
			Title:        "主理人",
			ToneStyle:    "专业、严谨、生动易懂",
			SystemPrompt: "以专业经验分享高价值实用内容",
		}
	}

	// Fetch memories
	var memoryItems []domain.MemoryItem
	_ = s.db.WithContext(ctx).Where("brand_id = ? OR org_id = ?", persona.BrandID, persona.OrgID).Limit(10).Find(&memoryItems).Error

	var coreMemories []string
	for _, m := range memoryItems {
		coreMemories = append(coreMemories, fmt.Sprintf("【%s】: %s", m.Title, m.Content))
	}

	return &domain.CreatorAIContext{
		CreatorID:    creatorID,
		CreatorName:  persona.Name,
		Profession:   persona.Title,
		ToneStyle:    persona.ToneStyle,
		SystemPrompt: persona.SystemPrompt,
		CoreMemories: coreMemories,
		BrandRules:   "严禁夸大虚假宣传，保持专业真实调性",
	}, nil
}

type MemoryCandidate struct {
	Category string  `json:"category"`
	Title    string  `json:"title"`
	Content  string  `json:"content"`
	Weight   float64 `json:"weight"`
}

// ExtractMemories analyzes user dialog or content text and extracts long-term memory candidates
func (s *MemoryService) ExtractMemories(ctx context.Context, text string) ([]MemoryCandidate, error) {
	prompt := fmt.Sprintf(`你是一名资深的创作者人设与记忆抽取引擎。
请从以下创作者的表达或材料中提取高价值的长期记忆点（包括个人经历、独特观点、说话口吻、禁忌偏好等）。

【输入文本】：
%s

请直接输出 JSON 数组格式：
[
  {
    "category": "VIEWPOINT", // IDENTITY | VIEWPOINT | STYLE | STORY | CONSTRAINT | PREFERENCE
    "title": "记忆主题（简短概括）",
    "content": "具体记忆内容详情",
    "weight": 1.0
  }
]`, text)

	resp, err := s.aiGateway.Chat(ctx, "", aigateway.ChatRequest{
		Messages: []aigateway.ChatMessage{
			{Role: "user", Content: prompt},
		},
		Temperature: 0.3,
	})
	if err != nil {
		return nil, fmt.Errorf("ai memory extraction failed: %w", err)
	}

	var candidates []MemoryCandidate
	if err := json.Unmarshal([]byte(resp.Content), &candidates); err != nil {
		return nil, fmt.Errorf("failed to parse memory candidates: %w", err)
	}

	return candidates, nil
}

// CommitMemory saves an approved memory candidate into database
func (s *MemoryService) CommitMemory(ctx context.Context, tenantID, brandID, categoryID string, candidate MemoryCandidate) (*domain.MemoryItem, error) {
	item := &domain.MemoryItem{
		ID:         idgen.GenerateID("mem"),
		OrgID:      tenantID,
		BrandID:    brandID,
		CategoryID: categoryID,
		Title:      candidate.Title,
		Content:    candidate.Content,
		Weight:     candidate.Weight,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.db.WithContext(ctx).Create(item).Error; err != nil {
		return nil, fmt.Errorf("failed to save memory item: %w", err)
	}

	return item, nil
}
