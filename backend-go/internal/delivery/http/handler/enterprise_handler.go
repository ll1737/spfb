package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/service"
)

type EnterpriseHandler struct {
	entService *service.EnterpriseService
}

func NewEnterpriseHandler(entService *service.EnterpriseService) *EnterpriseHandler {
	return &EnterpriseHandler{entService: entService}
}

// GET /api/enterprise
func (h *EnterpriseHandler) GetEnterprise(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	data, err := h.entService.GetFullEnterpriseData(orgIDStr)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, data)
}

// PUT /api/enterprise
func (h *EnterpriseHandler) UpdateEnterprise(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	var update domain.EnterpriseInfo
	if err := c.ShouldBindJSON(&update); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的企业资料参数")
		return
	}

	ent, err := h.entService.UpdateEnterprise(orgIDStr, &update)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success":    true,
		"message":    "企业资料已成功更新",
		"enterprise": ent,
	})
}

// POST /api/enterprise/brands
func (h *EnterpriseHandler) AddBrand(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	var brand domain.Brand
	if err := c.ShouldBindJSON(&brand); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的品牌参数")
		return
	}

	newBrand, err := h.entService.AddBrand(orgIDStr, &brand)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "矩阵子品牌创建成功",
		"brand":   newBrand,
	})
}

// POST /api/enterprise/brands/switch
func (h *EnterpriseHandler) SwitchBrand(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	var body struct {
		BrandID string `json:"brandId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.BrandID == "" {
		response.Error(c, http.StatusBadRequest, "请指定要切换的品牌ID")
		return
	}

	if err := h.entService.SwitchBrand(orgIDStr, body.BrandID); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "已切换当前活跃品牌",
	})
}

// DELETE /api/enterprise/brands/:id
func (h *EnterpriseHandler) DeleteBrand(c *gin.Context) {
	brandID := c.Param("id")
	if err := h.entService.DeleteBrand(brandID); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "品牌已删除",
	})
}

// POST /api/enterprise/members
func (h *EnterpriseHandler) AddMember(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	var member domain.TeamMember
	if err := c.ShouldBindJSON(&member); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的成员参数")
		return
	}

	newMember, err := h.entService.AddMember(orgIDStr, &member)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "团队成员已添加/邀请",
		"member":  newMember,
	})
}

// PUT /api/enterprise/members/:id
func (h *EnterpriseHandler) UpdateMember(c *gin.Context) {
	memberID := c.Param("id")
	var update domain.TeamMember
	if err := c.ShouldBindJSON(&update); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的成员更新参数")
		return
	}

	updated, err := h.entService.UpdateMember(memberID, &update)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "成员角色与权限已更新",
		"member":  updated,
	})
}

// DELETE /api/enterprise/members/:id
func (h *EnterpriseHandler) DeleteMember(c *gin.Context) {
	memberID := c.Param("id")
	if err := h.entService.DeleteMember(memberID); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "成员已被移出团队",
	})
}

// PUT /api/enterprise/rules
func (h *EnterpriseHandler) UpdateRules(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	var rule domain.CollaborationRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的审批流规则参数")
		return
	}

	saved, err := h.entService.UpdateCollaborationRule(orgIDStr, &rule)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success":           true,
		"message":           "协作与审批规则已生效",
		"collaborationRule": saved,
	})
}

// GET /api/enterprise/permissions
func (h *EnterpriseHandler) GetPermissions(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	matrix, err := h.entService.GetPermissionsMatrix(orgIDStr)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, matrix)
}

// PUT /api/enterprise/permissions
func (h *EnterpriseHandler) UpdatePermissions(c *gin.Context) {
	orgID, _ := c.Get(middleware.CtxEnterpriseIDKey)
	orgIDStr := ""
	if orgID != nil {
		orgIDStr = orgID.(string)
	}

	var rules []domain.ModulePermissionRule
	if err := c.ShouldBindJSON(&rules); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的权限矩阵参数")
		return
	}

	if err := h.entService.UpdatePermissionsMatrix(orgIDStr, rules); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "模块 RBAC 权限矩阵已更新",
	})
}
