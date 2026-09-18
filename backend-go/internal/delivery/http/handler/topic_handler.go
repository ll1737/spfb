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
)

type TopicHandler struct {
	repo *mysql.TopicRepository
}

func NewTopicHandler(repo *mysql.TopicRepository) *TopicHandler {
	return &TopicHandler{repo: repo}
}

func (h *TopicHandler) List(c *gin.Context) {
	orgID, brandID := topicScope(c)
	rows, err := h.repo.List(orgID, brandID, c.Query("status"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, rows)
}

func (h *TopicHandler) Create(c *gin.Context) {
	orgID, brandID := topicScope(c)
	if orgID == "" {
		response.Error(c, http.StatusBadRequest, "企业空间未初始化")
		return
	}
	var topic domain.Topic
	if err := c.ShouldBindJSON(&topic); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的选题参数")
		return
	}
	if err := service.ValidateTopic(&topic); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	now := time.Now()
	topic.ID = fmt.Sprintf("topic_%d", now.UnixNano())
	topic.OrgID = orgID
	topic.BrandID = brandID
	topic.Title = strings.TrimSpace(topic.Title)
	topic.Status = "recommended"
	topic.CreatedAt = now
	topic.UpdatedAt = now
	if err := h.repo.Save(&topic); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, topic)
}

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
	return orgID, brandID
}
