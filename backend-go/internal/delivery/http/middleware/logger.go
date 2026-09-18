package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/pkg/logger"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		cost := time.Since(start)
		status := c.Writer.Status()

		if logger.Log != nil {
			logger.Log.Infof("[HTTP] %s %s?%s | Status: %d | Cost: %v | IP: %s",
				c.Request.Method, path, query, status, cost, c.ClientIP())
		}
	}
}
