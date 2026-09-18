package learning

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

type LearningService struct {
	db        *gorm.DB
	aiGateway *aigateway.AIGateway
}

func NewLearningService(db *gorm.DB, aiGateway *aigateway.AIGateway) *LearningService {
	return &LearningService{
		db:        db,
		aiGateway: aiGateway,
	}
}

// RecordSnapshot records metrics returned from social media platforms
func (s *LearningService) RecordSnapshot(ctx context.Context, snapshot *domain.ContentMetricSnapshot) error {
	if snapshot.ID == "" {
		snapshot.ID = idgen.GenerateID("snap")
	}
	if snapshot.CollectedAt.IsZero() {
		snapshot.CollectedAt = time.Now()
	}
	snapshot.CreatedAt = time.Now()
	if snapshot.Views > 0 {
		snapshot.EngagementRate = float64(snapshot.Likes+snapshot.Comments+snapshot.Favorites) / float64(snapshot.Views)
	}
	return s.db.WithContext(ctx).Create(snapshot).Error
}

// AnalyzeAndGenerateInsights analyzes high-performing snapshots for a creator and extracts actionable insights
func (s *LearningService) AnalyzeAndGenerateInsights(ctx context.Context, tenantID, creatorID string) ([]domain.PerformanceInsight, error) {
	var snapshots []domain.ContentMetricSnapshot
	err := s.db.WithContext(ctx).
		Where("tenant_id = ? AND creator_id = ?", tenantID, creatorID).
		Order("likes DESC, views DESC").
		Limit(10).
		Find(&snapshots).Error
	if err != nil {
		return nil, err
	}

	if len(snapshots) == 0 {
		return nil, nil
	}

	snapData, _ := json.Marshal(snapshots)
	prompt := fmt.Sprintf(`你是一名全网爆款内容投后数据分析与 AI 学习专家。
请分析以下创作者近期高互动内容的数据表现，提炼出 1-3 条高置信度的创作规律（Performance Insights）：

【数据快照】：
%s

请严格输出 JSON 数组格式：
[
  {
    "insightType": "HOOK", // HOOK | STRUCTURE | CTA | TOPIC | TIMING
    "statement": "高表现规律总结（如：以悬念提问开头的视频完播率高出平均值 35%%）",
    "confidence": 0.92
  }
]`, string(snapData))

	resp, err := s.aiGateway.Chat(ctx, "", aigateway.ChatRequest{
		Messages: []aigateway.ChatMessage{
			{Role: "user", Content: prompt},
		},
		Temperature: 0.2,
	})
	if err != nil {
		return nil, fmt.Errorf("ai learning analysis failed: %w", err)
	}

	var rawInsights []struct {
		InsightType string  `json:"insightType"`
		Statement   string  `json:"statement"`
		Confidence  float64 `json:"confidence"`
	}

	if err := json.Unmarshal([]byte(resp.Content), &rawInsights); err != nil {
		return nil, nil
	}

	var createdInsights []domain.PerformanceInsight
	for _, ri := range rawInsights {
		insight := domain.PerformanceInsight{
			ID:           idgen.GenerateID("ins"),
			TenantID:     tenantID,
			CreatorID:    creatorID,
			InsightType:  ri.InsightType,
			Statement:    ri.Statement,
			SampleSize:   len(snapshots),
			Confidence:   ri.Confidence,
			Status:       "pending",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		_ = s.db.WithContext(ctx).Create(&insight)
		createdInsights = append(createdInsights, insight)
	}

	return createdInsights, nil
}

// ApproveInsight approves an insight and transforms it into creator's long-term performance memory
func (s *LearningService) ApproveInsight(ctx context.Context, insightID, approverUserID string) (*domain.MemoryItem, error) {
	var insight domain.PerformanceInsight
	if err := s.db.WithContext(ctx).Where("id = ?", insightID).First(&insight).Error; err != nil {
		return nil, err
	}

	insight.Status = "approved"
	insight.ApprovedBy = approverUserID
	insight.UpdatedAt = time.Now()
	_ = s.db.WithContext(ctx).Save(&insight)

	// Convert to MemoryItem
	mem := &domain.MemoryItem{
		ID:         idgen.GenerateID("mem_perf"),
		OrgID:      insight.TenantID,
		Title:      fmt.Sprintf("高表现规律【%s】", insight.InsightType),
		Content:    insight.Statement,
		Weight:     insight.Confidence * 1.5,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.db.WithContext(ctx).Create(mem).Error; err != nil {
		return nil, err
	}

	return mem, nil
}
