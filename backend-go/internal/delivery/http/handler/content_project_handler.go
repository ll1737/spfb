package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/service"
	"zhiyu-backend/pkg/idgen"
)

type ContentProjectHandler struct {
	projectSvc *service.ContentProjectService
}

func NewContentProjectHandler(projectSvc *service.ContentProjectService) *ContentProjectHandler {
	return &ContentProjectHandler{projectSvc: projectSvc}
}

type CreateProjectRequest struct {
	CreatorID   string `json:"creatorId" binding:"required"`
	TopicTitle  string `json:"topicTitle" binding:"required"`
	Angle       string `json:"angle"`
	ContentType string `json:"contentType"`
}

func (h *ContentProjectHandler) CreateAndGenerateMaster(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": "invalid request body", "error": err.Error()})
		return
	}

	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)
	if tenantIDStr == "" {
		tenantIDStr = "default_tenant"
	}

	projectID := idgen.GenerateUUID()
	aiCtx := &domain.CreatorAIContext{
		CreatorID:    req.CreatorID,
		CreatorName:  "专业创作者",
		Profession:   "内容专家",
		ToneStyle:    "专业、生动、通俗易懂",
		SystemPrompt: "以严谨专业的态度向大众科普",
	}

	mc, err := h.projectSvc.GenerateMasterContent(c.Request.Context(), tenantIDStr, projectID, req.TopicTitle, req.Angle, aiCtx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": "failed to generate master content", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "master content generated successfully",
		"data": gin.H{
			"projectId":     projectID,
			"masterContent": mc,
		},
	})
}
