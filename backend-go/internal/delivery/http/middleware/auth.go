package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/config"
	"zhiyu-backend/pkg/jwt"
)

const (
	CtxUserIDKey         = "userID"
	CtxUsernameKey       = "username"
	CtxRoleKey           = "role"
	CtxEnterpriseIDKey   = "enterpriseID"
	CtxCurrentBrandIDKey = "currentBrandID"
)

func Auth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "未提供身份认证凭据 (Missing Authorization header)"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && strings.EqualFold(parts[0], "Bearer")) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "无效的凭据格式 (Invalid Bearer token)"})
			return
		}

		claims, err := jwt.ParseToken(parts[1], cfg.JWT.Secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "身份凭据已过期或无效，请重新登录"})
			return
		}

		c.Set(CtxUserIDKey, claims.UserID)
		c.Set(CtxUsernameKey, claims.Username)
		c.Set(CtxRoleKey, claims.Role)
		c.Set(CtxEnterpriseIDKey, claims.EnterpriseID)
		c.Set(CtxCurrentBrandIDKey, claims.CurrentBrandID)

		c.Next()
	}
}
