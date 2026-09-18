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

type ContentPackageHandler struct {
	repo *mysql.ContentPackageRepository
}

func NewContentPackageHandler(repo *mysql.ContentPackageRepository) *ContentPackageHandler {
	return &ContentPackageHandler{repo: repo}
}

func (h *ContentPackageHandler) List(c *gin.Context) {
	orgID, brandID := contentPackageScope(c)
	rows, err := h.repo.List(orgID, brandID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, rows)
}

func (h *ContentPackageHandler) Create(c *gin.Context) {
	orgID, brandID := contentPackageScope(c)
	if orgID == "" {
		response.Error(c, http.StatusBadRequest, "企业空间未初始化")
		return
	}
	var row domain.ContentPackage
	if err := c.ShouldBindJSON(&row); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的内容包参数")
		return
	}
	if err := service.ValidateContentPackage(&row); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	now := time.Now()
	row.ID = fmt.Sprintf("content_package_%d", now.UnixNano())
	row.OrgID = orgID
	row.BrandID = brandID
	row.Title = strings.TrimSpace(row.Title)
	row.Status = "draft"
	row.CreatedAt = now
	row.UpdatedAt = now
	if err := h.repo.Save(&row); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, row)
}

func (h *ContentPackageHandler) Delete(c *gin.Context) {
	orgID, brandID := contentPackageScope(c)
	if err := h.repo.Delete(orgID, brandID, c.Param("id")); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func contentPackageScope(c *gin.Context) (string, string) {
	orgValue, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandValue, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	orgID, _ := orgValue.(string)
	brandID, _ := brandValue.(string)
	return orgID, brandID
}
