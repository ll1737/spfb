package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/learning"
)

type LearningHandler struct {
	learningSvc *learning.LearningService
}

func NewLearningHandler(learningSvc *learning.LearningService) *LearningHandler {
	return &LearningHandler{learningSvc: learningSvc}
}

func (h *LearningHandler) AnalyzeMetrics(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)
	creatorID := c.Param("creatorId")

	insights, err := h.learningSvc.AnalyzeAndGenerateInsights(c.Request.Context(), tenantIDStr, creatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": "failed to analyze metrics", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    insights,
	})
}

func (h *LearningHandler) ApproveInsight(c *gin.Context) {
	insightID := c.Param("id")
	userID, _ := c.Get("user_id")
	userIDStr, _ := userID.(string)

	mem, err := h.learningSvc.ApproveInsight(c.Request.Context(), insightID, userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50002, "message": "failed to approve insight", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "insight approved and converted into performance memory",
		"data":    mem,
	})
}

func (h *LearningHandler) RecordSnapshot(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)

	var req domain.ContentMetricSnapshot
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": "invalid request body", "error": err.Error()})
		return
	}

	req.TenantID = tenantIDStr
	if err := h.learningSvc.RecordSnapshot(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50003, "message": "failed to record metric snapshot", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "metric snapshot recorded",
		"data":    req,
	})
}
