package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type CustomClaims struct {
	UserID         string `json:"userId"`
	Username       string `json:"username"`
	Role           string `json:"role"`
	EnterpriseID   string `json:"enterpriseId,omitempty"`
	CurrentBrandID string `json:"currentBrandId,omitempty"`
	jwt.RegisteredClaims
}

// GenerateToken generates a signed JWT token
func GenerateToken(secret string, expireDuration time.Duration, claims CustomClaims) (string, error) {
	claims.RegisteredClaims = jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(expireDuration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "zhiyu-backend",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseToken validates and parses JWT token
func ParseToken(tokenStr, secret string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
