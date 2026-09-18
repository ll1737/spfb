package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/knowledge"
)

type KnowledgeHandler struct {
	service *knowledge.Service
}

func NewKnowledgeHandler(service *knowledge.Service) *KnowledgeHandler {
	return &KnowledgeHandler{service: service}
}

func (h *KnowledgeHandler) List(c *gin.Context) {
	tenantID, brandID, _ := creatorScope(c)
	rows, err := h.service.List(c.Request.Context(), tenantID, brandID, c.Query("creatorId"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, rows)
}

func (h *KnowledgeHandler) Create(c *gin.Context) {
	tenantID, brandID, _ := creatorScope(c)
	var input knowledge.CreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的知识文档参数")
		return
	}
	value, err := h.service.Create(c.Request.Context(), tenantID, brandID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, value)
}

func (h *KnowledgeHandler) Delete(c *gin.Context) {
	tenantID, _, _ := creatorScope(c)
	if err := h.service.Delete(c.Request.Context(), tenantID, c.Param("id")); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
