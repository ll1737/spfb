package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/service"
)

type PublishHandler struct {
	pubService *service.PublishService
}

func NewPublishHandler(pubService *service.PublishService) *PublishHandler {
	return &PublishHandler{pubService: pubService}
}

// GET /api/jobs
func (h *PublishHandler) ListJobs(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	orgIDStr := ""
	brandIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}
	if brandID != nil {
		brandIDStr = brandID.(string)
	}

	jobs, err := h.pubService.ListJobs(orgIDStr, brandIDStr)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, jobs)
}

// GET /api/publish/:id
func (h *PublishHandler) GetJob(c *gin.Context) {
	id := c.Param("id")
	job, err := h.pubService.GetJobByID(id)
	if err != nil || job == nil {
		response.Error(c, http.StatusNotFound, "发布任务不存在")
		return
	}

	response.Success(c, job)
}

// POST /api/publish
func (h *PublishHandler) CreateJob(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	orgIDStr := ""
	brandIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}
	if brandID != nil {
		brandIDStr = brandID.(string)
	}

	var req service.CreatePublishJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的发布参数: "+err.Error())
		return
	}

	job, err := h.pubService.CreateJob(orgIDStr, brandIDStr, req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusCreated, job)
}

// GET /api/tasks
func (h *PublishHandler) ListTasks(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	orgIDStr := ""
	brandIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}
	if brandID != nil {
		brandIDStr = brandID.(string)
	}

	tasks, err := h.pubService.ListTasks(orgIDStr, brandIDStr)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, tasks)
}

// POST /api/tasks/:id/retry
func (h *PublishHandler) RetryTask(c *gin.Context) {
	id := c.Param("id")
	task, err := h.pubService.RetryTask(id)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, task)
}

// POST /api/tasks/:id/cancel
func (h *PublishHandler) CancelTask(c *gin.Context) {
	id := c.Param("id")
	task, err := h.pubService.CancelTask(id)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, task)
}
