package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	creatorapp "zhiyu-backend/internal/creator"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/service"
)

type ContentProjectHandler struct {
	projectSvc *service.ContentProjectService
	creatorSvc *creatorapp.Service
}

func NewContentProjectHandler(projectSvc *service.ContentProjectService, creatorSvc *creatorapp.Service) *ContentProjectHandler {
	return &ContentProjectHandler{projectSvc: projectSvc, creatorSvc: creatorSvc}
}

type CreateProjectRequest struct {
	CreatorID   string `json:"creatorId" binding:"required"`
	TopicTitle  string `json:"topicTitle" binding:"required"`
	Angle       string `json:"angle"`
	ContentType string `json:"contentType"`
}

func (h *ContentProjectHandler) List(c *gin.Context) {
	tenantID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	tenantIDStr, _ := tenantID.(string)
	rows, total, err := h.projectSvc.ListProjects(c.Request.Context(), tenantIDStr, c.Query("creatorId"), 50, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"items": rows, "total": total}})
}

func (h *ContentProjectHandler) Get(c *gin.Context) {
	tenantID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	tenantIDStr, _ := tenantID.(string)
	value, err := h.projectSvc.GetProject(c.Request.Context(), tenantIDStr, c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 40401, "message": "内容项目不存在或无权访问"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": value})
}

func (h *ContentProjectHandler) Create(c *gin.Context) {
	var input struct {
		CreatorID string `json:"creatorId"`
		service.CreateContentProjectInput
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": "无效的内容项目参数"})
		return
	}
	tenantID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	userID, _ := c.Get(middleware.CtxUserIDKey)
	value, err := h.projectSvc.CreateProject(c.Request.Context(), valueString(tenantID), valueString(brandID), input.CreatorID, valueString(userID), input.CreateContentProjectInput)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40002, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": value})
}

func (h *ContentProjectHandler) CreateAndGenerateMaster(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": "invalid request body", "error": err.Error()})
		return
	}

	tenantID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	tenantIDStr, _ := tenantID.(string)
	if tenantIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40002, "message": "企业空间未初始化"})
		return
	}

	aiCtx, err := h.creatorSvc.BuildAIContext(c.Request.Context(), tenantIDStr, req.CreatorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40003, "message": "无法读取 Creator 真实上下文", "error": err.Error()})
		return
	}

	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	userID, _ := c.Get(middleware.CtxUserIDKey)
	project, err := h.projectSvc.CreateProject(c.Request.Context(), tenantIDStr, valueString(brandID), req.CreatorID, valueString(userID), service.CreateContentProjectInput{Title: req.TopicTitle, ContentType: req.ContentType})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40004, "message": "failed to create content project", "error": err.Error()})
		return
	}
	mc, err := h.projectSvc.GenerateMasterContent(c.Request.Context(), tenantIDStr, project.ID, req.TopicTitle, req.Angle, aiCtx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": "failed to generate master content", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "master content generated successfully",
		"data": gin.H{
			"projectId":     project.ID,
			"masterContent": mc,
		},
	})
}

func valueString(value interface{}) string {
	result, _ := value.(string)
	return result
}
