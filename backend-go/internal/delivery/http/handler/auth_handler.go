package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
	entService  *service.EnterpriseService
}

func NewAuthHandler(authService *service.AuthService, entService *service.EnterpriseService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		entService:  entService,
	}
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的登录参数: "+err.Error())
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

	response.Success(c, resp)
}

// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的注册参数: "+err.Error())
		return
	}

	resp, err := h.authService.Register(c.Request.Context(), req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, resp)
}

// GET /api/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get(middleware.CtxUserIDKey)
	if userID == nil {
		response.Error(c, http.StatusUnauthorized, "未授权访问")
		return
	}

	user, err := h.authService.GetUserByID(userID.(string))
	if err != nil || user == nil {
		response.Error(c, http.StatusNotFound, "用户不存在")
		return
	}

	ent, _ := h.entService.GetFullEnterpriseData(user.EnterpriseID)
	var entInfo *domain.EnterpriseInfo
	if ent != nil {
		entInfo = ent.Enterprise
	}

	response.Success(c, gin.H{
		"user":       user,
		"enterprise": entInfo,
	})
}

// PUT /api/auth/profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get(middleware.CtxUserIDKey)
	var req domain.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的资料参数")
		return
	}

	user, err := h.authService.UpdateProfile(userID.(string), req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "个人资料已保存",
		"user":    user,
	})
}

// POST /api/auth/change-password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get(middleware.CtxUserIDKey)
	var req domain.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请填写新旧密码")
		return
	}

	if err := h.authService.ChangePassword(userID.(string), req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "密码修改成功，请妥善保管",
	})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	_ = h.authService.Logout(c.Request.Context(), authHeader)
	response.Success(c, gin.H{
		"success": true,
		"message": "已安全退出登录",
	})
}

// GET /api/auth/status
func (h *AuthHandler) AuthStatus(c *gin.Context) {
	count, _ := h.authService.GetUserCount()
	response.Success(c, gin.H{
		"hasUsers":      count > 0,
		"userCount":     count,
		"authenticated": true,
		"multiOrgMode":  true,
		"backend":       "go-gin-enterprise",
	})
}
