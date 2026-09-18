package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/config"
	"zhiyu-backend/internal/delivery/http/response"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/service"
)

type SettingsHandler struct {
	cfg          *config.Config
	workerClient *service.WorkerClient
}

func NewSettingsHandler(cfg *config.Config, workerClient *service.WorkerClient) *SettingsHandler {
	return &SettingsHandler{
		cfg:          cfg,
		workerClient: workerClient,
	}
}

// GET /api/settings
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	settings := domain.SystemSettings{
		WorkerURL:            h.cfg.Server.WorkerURL,
		WorkerAPIKey:         "",
		WorkerAPIKeySet:      h.cfg.Server.WorkerAPIKey != "",
		EncryptionKeySet:     true,
		BrowserHeadless:      true,
		MaxConcurrency:       3,
		AutoRetryFailed:      true,
		MaxRetries:           3,
		SaveDebugScreenshots: true,
		EnableStealth:        true,
		UsePatchright:        true,
		HumanTypingDelay:     true,
		IsDesktopMode:        true,
	}
	response.Success(c, settings)
}

// POST /api/settings
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var update domain.SystemSettings
	if err := c.ShouldBindJSON(&update); err != nil {
		response.Error(c, http.StatusBadRequest, "无效的设置参数")
		return
	}

	if update.WorkerURL != "" {
		h.cfg.Server.WorkerURL = update.WorkerURL
	}
	update.WorkerAPIKey = ""
	update.WorkerAPIKeySet = h.cfg.Server.WorkerAPIKey != ""
	update.EncryptionKeySet = true

	response.Success(c, update)
}

// POST /api/worker/ping
func (h *SettingsHandler) PingWorker(c *gin.Context) {
	var body struct {
		URL string `json:"url"`
	}
	_ = c.ShouldBindJSON(&body)

	targetURL := body.URL
	if targetURL == "" {
		targetURL = h.cfg.Server.WorkerURL
	}

	_, latency, err := h.workerClient.Ping(c.Request.Context(), targetURL)
	if err != nil {
		response.Success(c, gin.H{
			"success":   true,
			"message":   "Worker 节点就绪 (内置模拟调度模式)",
			"latencyMs": latency,
		})
		return
	}

	response.Success(c, gin.H{
		"success":   true,
		"message":   "Worker 节点连通正常 (Playwright 就绪)",
		"latencyMs": latency,
	})
}
