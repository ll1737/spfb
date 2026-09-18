package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/calendar"
)

type CalendarHandler struct {
	calSvc *calendar.CalendarService
}

func NewCalendarHandler(calSvc *calendar.CalendarService) *CalendarHandler {
	return &CalendarHandler{calSvc: calSvc}
}

func (h *CalendarHandler) GetCalendar(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)

	creatorID := c.Query("creatorId")
	platform := c.Query("platform")

	startStr := c.Query("start")
	endStr := c.Query("end")

	start := time.Now().AddDate(0, 0, -15)
	end := time.Now().AddDate(0, 0, 30)

	if t, err := time.Parse(time.RFC3339, startStr); err == nil {
		start = t
	}
	if t, err := time.Parse(time.RFC3339, endStr); err == nil {
		end = t
	}

	events, err := h.calSvc.GetCalendarEvents(c.Request.Context(), tenantIDStr, creatorID, platform, start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": "failed to fetch calendar events", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    events,
	})
}

type RescheduleRequest struct {
	ScheduledAt string `json:"scheduledAt" binding:"required"`
}

func (h *CalendarHandler) RescheduleTask(c *gin.Context) {
	taskID := c.Param("id")
	var req RescheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": "invalid request body", "error": err.Error()})
		return
	}

	newTime, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40002, "message": "invalid time format, expected RFC3339", "error": err.Error()})
		return
	}

	if err := h.calSvc.RescheduleTask(c.Request.Context(), taskID, newTime); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50002, "message": "failed to reschedule task", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "rescheduled successfully",
	})
}
