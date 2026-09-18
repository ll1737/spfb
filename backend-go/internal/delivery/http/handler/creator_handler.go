package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	creatorapp "zhiyu-backend/internal/creator"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
)

type CreatorHandler struct {
	service *creatorapp.Service
}

func NewCreatorHandler(service *creatorapp.Service) *CreatorHandler {
	return &CreatorHandler{service: service}
}

func (h *CreatorHandler) List(c *gin.Context) {
	tenantID, brandID, _ := creatorScope(c)
	rows, err := h.service.List(c.Request.Context(), tenantID, brandID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, rows)
}

func (h *CreatorHandler) ListOpsSummary(c *gin.Context) {
	tenantID, brandID, _ := creatorScope(c)
	rows, err := h.service.ListOpsSummaries(c.Request.Context(), tenantID, brandID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, rows)
}

func (h *CreatorHandler) Get(c *gin.Context) {
	tenantID, _, _ := creatorScope(c)
	value, err := h.service.Get(c.Request.Context(), tenantID, c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusNotFound, "创作者不存在或无权访问")
		return
	}
	response.Success(c, value)
}

func (h *CreatorHandler) Create(c *gin.Context) {
	tenantID, brandID, userID := creatorScope(c)
	var input creatorapp.CreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的创作者参数")
		return
	}
	value, err := h.service.Create(c.Request.Context(), tenantID, brandID, userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, value)
}

func (h *CreatorHandler) Update(c *gin.Context) {
	tenantID, _, _ := creatorScope(c)
	var input creatorapp.UpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的创作者参数")
		return
	}
	value, err := h.service.Update(c.Request.Context(), tenantID, c.Param("id"), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, value)
}

func (h *CreatorHandler) Delete(c *gin.Context) {
	tenantID, _, _ := creatorScope(c)
	if err := h.service.Delete(c.Request.Context(), tenantID, c.Param("id")); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func (h *CreatorHandler) ListPlans(c *gin.Context) {
	tenantID, _, _ := creatorScope(c)
	rows, err := h.service.ListPlans(c.Request.Context(), tenantID, c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, rows)
}

func (h *CreatorHandler) SavePlan(c *gin.Context) {
	tenantID, _, _ := creatorScope(c)
	var input creatorapp.PlanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的任务计划参数")
		return
	}
	value, err := h.service.SavePlan(c.Request.Context(), tenantID, c.Param("id"), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, value)
}

func creatorScope(c *gin.Context) (string, string, string) {
	tenantID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	userID, _ := c.Get(middleware.CtxUserIDKey)
	tenantIDString, _ := tenantID.(string)
	brandIDString, _ := brandID.(string)
	userIDString, _ := userID.(string)
	return tenantIDString, brandIDString, userIDString
}
