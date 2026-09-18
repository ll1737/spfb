package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/queue"
)

type JobHandler struct {
	jobQueue *queue.JobQueue
}

func NewJobHandler(jobQueue *queue.JobQueue) *JobHandler {
	return &JobHandler{jobQueue: jobQueue}
}

func (h *JobHandler) GetJob(c *gin.Context) {
	jobID := c.Param("id")
	job, exists := h.jobQueue.GetJob(jobID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"code": 40401, "message": "job not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    job,
	})
}

func (h *JobHandler) ListJobs(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr, _ := tenantID.(string)
	creatorID := c.Query("creatorId")

	jobs := h.jobQueue.ListJobs(tenantIDStr, creatorID, 50)
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    jobs,
	})
}
