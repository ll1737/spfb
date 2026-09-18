package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/credit"
)

type CreditHandler struct {
	creditSvc *credit.CreditService
}

func NewCreditHandler(creditSvc *credit.CreditService) *CreditHandler {
	return &CreditHandler{creditSvc: creditSvc}
}

func (h *CreditHandler) GetWallet(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)
	if tenantIDStr == "" {
		tenantIDStr = "default_tenant"
	}

	wallet, err := h.creditSvc.GetWallet(c.Request.Context(), tenantIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": "failed to get wallet", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    wallet,
	})
}

func (h *CreditHandler) ListLedgers(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)
	if tenantIDStr == "" {
		tenantIDStr = "default_tenant"
	}

	ledgers, err := h.creditSvc.ListLedger(c.Request.Context(), tenantIDStr, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50002, "message": "failed to list ledgers", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    ledgers,
	})
}
