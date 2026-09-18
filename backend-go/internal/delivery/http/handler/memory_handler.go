package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/internal/service"
)

type MemoryHandler struct {
	memRepo *mysql.MemoryRepository
}

func NewMemoryHandler(memRepo *mysql.MemoryRepository) *MemoryHandler {
	return &MemoryHandler{memRepo: memRepo}
}

// GET /api/memory/categories
func (h *MemoryHandler) ListCategories(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	cats, err := h.memRepo.ListCategories(orgIDStr)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, cats)
}

// POST /api/memory/categories
func (h *MemoryHandler) CreateCategory(c *gin.Context) {
	orgIDStr, _ := contextScope(c)
	if orgIDStr == "" {
		response.Error(c, http.StatusBadRequest, "企业空间未初始化")
		return
	}
	var category domain.MemoryCategory
	if err := c.ShouldBindJSON(&category); err != nil || category.Name == "" {
		response.Error(c, http.StatusBadRequest, "记忆分类名称不能为空")
		return
	}
	now := time.Now()
	category.ID = fmt.Sprintf("memory_category_%d", now.UnixNano())
	category.OrgID = orgIDStr
	category.UpdatedAt = now
	if err := h.memRepo.SaveCategory(&category); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, category)
}

// DELETE /api/memory/categories/:id
func (h *MemoryHandler) DeleteCategory(c *gin.Context) {
	orgIDStr, _ := contextScope(c)
	if err := h.memRepo.DeleteCategory(orgIDStr, c.Param("id")); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GET /api/memory/items
func (h *MemoryHandler) ListItems(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	catID := c.Query("categoryId")

	orgIDStr := ""
	brandIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}
	if brandID != nil {
		brandIDStr = brandID.(string)
	}

	items, err := h.memRepo.ListItems(orgIDStr, brandIDStr, catID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, items)
}

// POST /api/memory/items
func (h *MemoryHandler) CreateItem(c *gin.Context) {
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

	var item domain.MemoryItem
	if err := c.ShouldBindJSON(&item); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的记忆参数")
		return
	}
	if item.CategoryID == "" || item.Title == "" || item.Content == "" {
		response.Error(c, http.StatusBadRequest, "记忆分类、标题和内容不能为空")
		return
	}

	item.ID = fmt.Sprintf("mem_%d", time.Now().UnixNano()/1000000)
	item.OrgID = orgIDStr
	item.BrandID = brandIDStr
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()

	if err := h.memRepo.SaveItem(&item); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, item)
}

// DELETE /api/memory/items/:id
func (h *MemoryHandler) DeleteItem(c *gin.Context) {
	id := c.Param("id")
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr, _ = orgID.(string)
	}
	if orgIDStr == "" {
		response.Error(c, http.StatusBadRequest, "企业空间未初始化")
		return
	}
	if err := h.memRepo.DeleteItemForOrg(orgIDStr, id); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GET /api/creators
func (h *MemoryHandler) ListCreators(c *gin.Context) {
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

	creators, err := h.memRepo.ListCreators(orgIDStr, brandIDStr)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, creators)
}

// POST /api/creators
func (h *MemoryHandler) CreateCreator(c *gin.Context) {
	orgIDStr, brandIDStr := contextScope(c)
	if orgIDStr == "" {
		response.Error(c, http.StatusBadRequest, "企业空间未初始化")
		return
	}

	var creator domain.CreatorPersona
	if err := c.ShouldBindJSON(&creator); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的创作者参数")
		return
	}
	if err := service.ValidateCreator(&creator); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	now := time.Now()
	creator.ID = fmt.Sprintf("creator_%d", now.UnixNano())
	creator.OrgID = orgIDStr
	creator.BrandID = brandIDStr
	creator.Status = "active"
	creator.CreatedAt = now
	creator.UpdatedAt = now
	if err := h.memRepo.SaveCreator(&creator); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, creator)
}

// PUT /api/creators/:id
func (h *MemoryHandler) UpdateCreator(c *gin.Context) {
	orgIDStr, brandIDStr := contextScope(c)
	creator, err := h.memRepo.FindCreator(orgIDStr, brandIDStr, c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusNotFound, "创作者不存在或无权访问")
		return
	}

	var patch domain.CreatorPersona
	if err := c.ShouldBindJSON(&patch); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的创作者参数")
		return
	}
	if patch.Name != "" {
		creator.Name = patch.Name
	}
	if patch.Avatar != "" {
		creator.Avatar = patch.Avatar
	}
	if patch.Title != "" {
		creator.Title = patch.Title
	}
	if patch.Domain != "" {
		creator.Domain = patch.Domain
	}
	if patch.ToneStyle != "" {
		creator.ToneStyle = patch.ToneStyle
	}
	if patch.SystemPrompt != "" {
		creator.SystemPrompt = patch.SystemPrompt
	}
	if patch.KnowledgeBase != "" {
		creator.KnowledgeBase = patch.KnowledgeBase
	}
	if patch.TargetAudience != "" {
		creator.TargetAudience = patch.TargetAudience
	}
	if err := service.ValidateCreator(creator); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	creator.UpdatedAt = time.Now()
	if err := h.memRepo.SaveCreator(creator); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, creator)
}

// DELETE /api/creators/:id
func (h *MemoryHandler) DeleteCreator(c *gin.Context) {
	orgIDStr, brandIDStr := contextScope(c)
	if err := h.memRepo.DeleteCreator(orgIDStr, brandIDStr, c.Param("id")); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func contextScope(c *gin.Context) (string, string) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	brandID, _ := c.Get(middleware.CtxCurrentBrandIDKey)
	orgIDStr := ""
	brandIDStr := ""
	if orgID != nil {
		orgIDStr, _ = orgID.(string)
	}
	if brandID != nil {
		brandIDStr, _ = brandID.(string)
	}
	return orgIDStr, brandIDStr
}
