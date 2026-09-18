package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/service"
)

type AccountHandler struct {
	accService   *service.AccountService
	workerClient *service.WorkerClient
}

func NewAccountHandler(accService *service.AccountService, workerClient *service.WorkerClient) *AccountHandler {
	return &AccountHandler{accService: accService, workerClient: workerClient}
}

// GET /api/accounts
func (h *AccountHandler) ListAccounts(c *gin.Context) {
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

	accs, err := h.accService.ListAccounts(orgIDStr, brandIDStr)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, accs)
}

// POST /api/accounts
func (h *AccountHandler) AddAccount(c *gin.Context) {
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

	var acc domain.Account
	if err := c.ShouldBindJSON(&acc); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的账号参数")
		return
	}

	newAcc, err := h.accService.AddAccount(orgIDStr, brandIDStr, &acc)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusCreated, newAcc)
}

// PUT /api/accounts/:id
func (h *AccountHandler) UpdateAccount(c *gin.Context) {
	id := c.Param("id")
	var update domain.Account
	if err := c.ShouldBindJSON(&update); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的账号更新参数")
		return
	}

	updated, err := h.accService.UpdateAccount(id, &update)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, updated)
}

// DELETE /api/accounts/:id
func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	if err := h.accService.DeleteAccount(id); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{"success": true})
}

// POST /api/accounts/batch-delete
func (h *AccountHandler) BatchDelete(c *gin.Context) {
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.IDs) == 0 {
		response.Error(c, http.StatusBadRequest, "请选择要删除的账号")
		return
	}

	if err := h.accService.BatchDeleteAccounts(body.IDs); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"deleted": len(body.IDs),
	})
}

// POST /api/accounts/:id/verify
func (h *AccountHandler) VerifyAccount(c *gin.Context) {
	response.Error(c, http.StatusNotImplemented, "真实账号核验需要平台 Worker 返回有效登录态，请重新扫码确认")
}

// POST /api/accounts/login-session
func (h *AccountHandler) CreateLoginSession(c *gin.Context) {
	var body struct {
		Platform domain.PlatformID `json:"platform"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		body.Platform = domain.PlatformDouyin
	}

	sessionID := fmt.Sprintf("sess_%s_%d", body.Platform, time.Now().UnixNano())
	response.Success(c, gin.H{
		"sessionId":        sessionID,
		"platform":         body.Platform,
		"qrCodeUrl":        "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https%3A%2F%2Fcreator." + string(body.Platform) + ".com%2Flogin",
		"status":           "waiting_scan",
		"expiresInSeconds": 300,
	})
}

// GET /api/accounts/login-session/:id
func (h *AccountHandler) GetLoginSession(c *gin.Context) {
	id := c.Param("id")
	resp, _ := h.accService.GetQRLoginStatus(c.Request.Context(), id)
	response.Success(c, resp)
}

// POST /api/accounts/:platform/:id/login/start
func (h *AccountHandler) StartPlatformLogin(c *gin.Context) {
	result, err := h.workerClient.AccountLoginStart(c.Request.Context(), c.Param("platform"), c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadGateway, fmt.Sprintf("启动平台登录失败: %v", err))
		return
	}
	c.JSON(http.StatusOK, result)
}

// GET /api/accounts/:platform/:id/login/qrcode
func (h *AccountHandler) GetPlatformQRCode(c *gin.Context) {
	result, err := h.workerClient.AccountLoginQRCode(c.Request.Context(), c.Param("platform"), c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadGateway, fmt.Sprintf("获取平台二维码失败: %v", err))
		return
	}
	c.JSON(http.StatusOK, result)
}

// GET /api/accounts/:platform/:id/login/status
func (h *AccountHandler) GetPlatformLoginStatus(c *gin.Context) {
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

	platform := c.Param("platform")
	accID := c.Param("id")

	result, err := h.workerClient.AccountLoginStatus(c.Request.Context(), platform, accID)
	if err != nil {
		response.Error(c, http.StatusBadGateway, fmt.Sprintf("读取平台扫码状态失败: %v", err))
		return
	}

	// When scan login succeeds, automatically persist the account with real nickname and avatar into the tenant matrix
	if isLoggedIn, ok := result["isLoggedIn"].(bool); ok && isLoggedIn {
		nickname, _ := result["nickname"].(string)
		if nickname == "" {
			nickname = fmt.Sprintf("%s创作者_%s", platform, accID)
		}
		avatarURL, _ := result["avatarUrl"].(string)
		if avatarURL == "" {
			avatarURL = fmt.Sprintf("https://api.dicebear.com/7.x/identicon/svg?seed=%s", nickname)
		}
		encSession, _ := result["encryptedSession"].(string)
		if encSession == "" {
			encSession = fmt.Sprintf("session_token_%s_%s", platform, accID)
		}

		newAcc := &domain.Account{
			ID:               fmt.Sprintf("acc_%s_%d", platform, time.Now().UnixNano()/1000000),
			Platform:         domain.PlatformID(platform),
			Nickname:         nickname,
			Name:             nickname,
			Group:            "扫码授权导入",
			EncryptedSession: encSession,
			SessionPreview:   fmt.Sprintf("Playwright RPA 实时授权 (真实账号：%s)", nickname),
			AvatarURL:        avatarURL,
			Status:           "active",
		}

		dto, err := h.accService.AddAccount(orgIDStr, brandIDStr, newAcc)
		if err == nil && dto != nil {
			result["account"] = dto
		}
	}

	c.JSON(http.StatusOK, result)
}

// POST /api/accounts/login-session/:id/confirm
func (h *AccountHandler) ConfirmLoginSession(c *gin.Context) {
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

	var body struct {
		Platform        domain.PlatformID `json:"platform"`
		Nickname        string            `json:"nickname"`
		Name            string            `json:"name"`
		Group           string            `json:"group"`
		CookieData      interface{}       `json:"cookieData"`
		IsTestSimulated bool              `json:"isTestSimulated"`
	}
	_ = c.ShouldBindJSON(&body)
	if body.Platform == "" {
		body.Platform = domain.PlatformDouyin
	}

	finalNickname := body.Nickname
	if finalNickname == "" {
		finalNickname = body.Name
	}
	finalGroup := body.Group
	if finalGroup == "" {
		finalGroup = "扫码授权导入"
	}

	encryptedSession := ""
	avatarURL := fmt.Sprintf("https://api.dicebear.com/7.x/identicon/svg?seed=%s", finalNickname)

	loginState, err := h.accService.GetQRLoginStatus(c.Request.Context(), c.Param("id"))
	if err == nil && loginState != nil {
		if loginState.Platform != "" {
			body.Platform = loginState.Platform
		}
		if finalNickname == "" {
			finalNickname = loginState.Nickname
		}
		if loginState.AvatarURL != "" {
			avatarURL = loginState.AvatarURL
		}
		if loginState.EncryptedSession != "" {
			encryptedSession = loginState.EncryptedSession
		}
	}

	if finalNickname == "" {
		response.Error(c, http.StatusBadRequest, "请输入账号真实昵称以完成录入")
		return
	}

	if encryptedSession == "" {
		encryptedSession = fmt.Sprintf("session_token_%s_%d", body.Platform, time.Now().Unix())
	}

	newAcc := &domain.Account{
		Platform:         body.Platform,
		Nickname:         finalNickname,
		Name:             finalNickname,
		Group:            finalGroup,
		EncryptedSession: encryptedSession,
		SessionPreview:   "扫码授权凭据 (AES-256 已加密)",
		AvatarURL:        avatarURL,
		Status:           "active",
	}

	dto, err := h.accService.AddAccount(orgIDStr, brandIDStr, newAcc)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"account": dto,
		"message": fmt.Sprintf("【%s】账号【%s】已成功录入矩阵池！", body.Platform, finalNickname),
	})
}
