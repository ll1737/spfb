package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/delivery/http/middleware"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/service"
)

type SocialUploadHandler struct {
	accService *service.AccountService
}

func NewSocialUploadHandler(accService *service.AccountService) *SocialUploadHandler {
	return &SocialUploadHandler{accService: accService}
}

// POST /api/social-upload/cli-command
func (h *SocialUploadHandler) GenerateCLI(c *gin.Context) {
	var body struct {
		Platform       string   `json:"platform"`
		AccountName    string   `json:"accountName"`
		Title          string   `json:"title"`
		Content        string   `json:"content"`
		VideoPath      string   `json:"videoPath"`
		CoverTimestamp float64  `json:"coverTimestamp"`
		Tags           []string `json:"tags"`
		ScheduleTime   string   `json:"scheduleTime"`
	}
	_ = c.ShouldBindJSON(&body)
	if body.Platform == "" {
		body.Platform = "douyin"
	}
	if body.AccountName == "" {
		body.AccountName = "default"
	}
	if body.VideoPath == "" {
		body.VideoPath = "videos/demo.mp4"
	}

	var tagParts []string
	for _, t := range body.Tags {
		clean := strings.TrimPrefix(t, "#")
		if clean != "" {
			tagParts = append(tagParts, "#"+clean)
		}
	}
	fullDesc := strings.TrimSpace(body.Content + " " + strings.Join(tagParts, " "))

	cmd := fmt.Sprintf("python main.py upload --platform %s --account %s --video \"%s\"", body.Platform, body.AccountName, body.VideoPath)
	if body.Title != "" {
		cmd += fmt.Sprintf(" --title \"%s\"", body.Title)
	}
	if fullDesc != "" {
		cmd += fmt.Sprintf(" --desc \"%s\"", fullDesc)
	}

	response.Success(c, gin.H{
		"platform":      body.Platform,
		"command":       cmd,
		"dockerCommand": fmt.Sprintf("docker run --rm -v $(pwd)/cookies:/app/cookies -v $(pwd)/videos:/app/videos dreammis/social-auto-upload %s", cmd),
		"explanation":   fmt.Sprintf("使用 dreammis/social-auto-upload 引擎进行【%s】自动化发布，已适配 stealth.min.js 反爬伪装与封面时间戳抽取。", body.Platform),
	})
}

// POST /api/social-upload/import-cookie
func (h *SocialUploadHandler) ImportCookie(c *gin.Context) {
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
		FileName       string `json:"fileName"`
		Content        string `json:"content"`
		CustomPlatform string `json:"customPlatform"`
		CustomNickname string `json:"customNickname"`
		Group          string `json:"group"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Content == "" {
		response.Error(c, http.StatusBadRequest, "Cookie 内容不能为空")
		return
	}

	accDTO, err := h.accService.ImportCookie(orgIDStr, brandIDStr, body.FileName, body.Content, body.CustomPlatform, body.CustomNickname, body.Group)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": fmt.Sprintf("成功从 social-auto-upload 导入账号【%s】(%s)！", accDTO.Nickname, accDTO.Platform),
		"account": accDTO,
	})
}

// GET /api/social-upload/export-cookie/:id
func (h *SocialUploadHandler) ExportCookie(c *gin.Context) {
	id := c.Param("id")
	filename, rawJSON, err := h.accService.ExportCookie(id)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.String(http.StatusOK, rawJSON)
}
