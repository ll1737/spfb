package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/pkg/logger"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				if logger.Log != nil {
					logger.Log.Errorf("[PANIC RECOVER] %v", err)
				}
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"message": "服务器内部错误",
				})
			}
		}()
		c.Next()
	}
}
