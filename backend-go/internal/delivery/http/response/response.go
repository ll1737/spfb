package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data) // directly return data for 100% frontend contract compatibility
}

func SuccessWithMeta(c *gin.Context, data interface{}, msg string) {
	if msg == "" {
		msg = "success"
	}
	c.JSON(http.StatusOK, Response{
		Code:      0,
		Message:   msg,
		Data:      data,
		Timestamp: time.Now().Unix(),
	})
}

func Error(c *gin.Context, httpStatus int, message string) {
	c.JSON(httpStatus, gin.H{
		"message": message,
	})
}

func Fail(c *gin.Context, httpStatus int, code int, message string) {
	c.JSON(httpStatus, Response{
		Code:      code,
		Message:   message,
		Timestamp: time.Now().Unix(),
	})
}
