package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/internal/service"
	"zhiyu-backend/internal/topic"
)

type TopicHandler struct {
	repo    *mysql.TopicRepository
	service *topic.TopicService
}

func NewTopicHandler(repo *mysql.TopicRepository, svc *topic.TopicService) *TopicHandler {
	return &TopicHandler{
		repo:    repo,
		service: svc,
	}
}

// GET /api/topics
func (h *TopicHandler) List(c *gin.Context) {
	orgID, brandID := topicScope(c)
	typeFilter := c.Query("type")
	categoryFilter := c.Query("category")

	rows, err := h.repo.List(orgID, brandID, c.Query("status"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	// If empty, sync default batch
	if len(rows) == 0 {
		rows, _ = h.service.SyncTrending(c.Request.Context(), orgID, brandID, "口腔医疗")
	}

	// Filter in-memory by type / category if requested
	filtered := make([]domain.Topic, 0, len(rows))
	for _, item := range rows {
		if typeFilter != "" && string(item.Type) != typeFilter {
			continue
		}
		if categoryFilter != "" && item.Category != categoryFilter {
			continue
		}
		filtered = append(filtered, item)
	}

	response.Success(c, filtered)
}

// GET /api/topics/overview
func (h *TopicHandler) GetOverview(c *gin.Context) {
	orgID, brandID := topicScope(c)
	stats, err := h.service.GetOverview(c.Request.Context(), orgID, brandID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, stats)
}

// POST /api/topics/sync-trending
func (h *TopicHandler) SyncTrending(c *gin.Context) {
	orgID, brandID := topicScope(c)
	var body struct {
		Industry string `json:"industry"`
	}
	_ = c.ShouldBindJSON(&body)

	topics, err := h.service.SyncTrending(c.Request.Context(), orgID, brandID, body.Industry)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, fmt.Sprintf("抓取热搜失败: %v", err))
		return
	}
	response.Success(c, gin.H{
		"message": fmt.Sprintf("成功抓取并生成 %d 条最新行业选题！", len(topics)),
		"topics":  topics,
	})
}

// GET /api/topics/preferences
func (h *TopicHandler) GetPreferences(c *gin.Context) {
	orgID, brandID := topicScope(c)
	pref, err := h.service.GetPreferences(c.Request.Context(), orgID, brandID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, pref)
}

// POST /api/topics/preferences
func (h *TopicHandler) SavePreferences(c *gin.Context) {
	orgID, brandID := topicScope(c)
	var pref domain.TopicPreference
	if err := c.ShouldBindJSON(&pref); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的偏好参数")
		return
	}
	pref.OrgID = orgID
	pref.BrandID = brandID
	if err := h.service.SavePreferences(c.Request.Context(), &pref); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, pref)
}

// POST /api/topics/generate-weekly-plan
func (h *TopicHandler) GenerateWeeklyPlan(c *gin.Context) {
	orgID, brandID := topicScope(c)
	planTopics, err := h.service.GenerateWeeklyPlan(c.Request.Context(), orgID, brandID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, gin.H{
		"message": "已成功生成本周 7 天高价值选题排期计划！",
		"plan":    planTopics,
	})
}

// POST /api/topics
func (h *TopicHandler) Create(c *gin.Context) {
	orgID, brandID := topicScope(c)
	if orgID == "" {
		response.Error(c, http.StatusBadRequest, "企业空间未初始化")
		return
	}
	var topicItem domain.Topic
	if err := c.ShouldBindJSON(&topicItem); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的选题参数")
		return
	}
	if err := service.ValidateTopic(&topicItem); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	now := time.Now()
	topicItem.ID = fmt.Sprintf("topic_%d", now.UnixNano())
	topicItem.OrgID = orgID
	topicItem.BrandID = brandID
	topicItem.Title = strings.TrimSpace(topicItem.Title)
	if topicItem.Type == "" {
		topicItem.Type = domain.TopicTypeAIRecommended
	}
	if topicItem.Score <= 0 {
		topicItem.Score = 90
	}
	if topicItem.HeatScore <= 0 {
		topicItem.HeatScore = 85
	}
	if topicItem.MatchScore <= 0 {
		topicItem.MatchScore = 92
	}
	if topicItem.CommercialScore <= 0 {
		topicItem.CommercialScore = 90
	}
	if topicItem.Reason == "" {
		topicItem.Reason = "人工指定高优先级业务选题，已加入创作候选池。"
	}
	topicItem.Status = "recommended"
	topicItem.CreatedAt = now
	topicItem.UpdatedAt = now
	if err := h.repo.Save(&topicItem); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, topicItem)
}

// DELETE /api/topics/:id
func (h *TopicHandler) Delete(c *gin.Context) {
	orgID, brandID := topicScope(c)
	if err := h.repo.Delete(orgID, brandID, c.Param("id")); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func topicScope(c *gin.Context) (string, string) {
	orgValue, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandValue, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	orgID, _ := orgValue.(string)
	brandID, _ := brandValue.(string)
	if orgID == "" {
		orgID = "org_default"
	}
	if brandID == "" {
		brandID = "brand_default"
	}
	return orgID, brandID
}

