package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/asset"
	"zhiyu-backend/internal/domain"
)

type AssetHandler struct {
	assetSvc *asset.AssetService
}

func NewAssetHandler(assetSvc *asset.AssetService) *AssetHandler {
	return &AssetHandler{assetSvc: assetSvc}
}

func (h *AssetHandler) ListAssets(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)

	creatorID := c.Query("creatorId")
	assetType := c.Query("type")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	assets, total, err := h.assetSvc.ListAssets(c.Request.Context(), tenantIDStr, creatorID, assetType, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": "failed to list assets", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"total": total,
			"items": assets,
		},
	})
}

func (h *AssetHandler) CreateAsset(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)

	var req domain.Asset
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": "invalid request body", "error": err.Error()})
		return
	}

	req.TenantID = tenantIDStr
	if err := h.assetSvc.CreateAsset(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50002, "message": "failed to create asset", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "asset created successfully",
		"data":    req,
	})
}
