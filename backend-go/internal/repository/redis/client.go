package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"zhiyu-backend/internal/config"
	"zhiyu-backend/pkg/logger"
)

var RDB *redis.Client

func InitRedis(cfg config.RedisConfig) (*redis.Client, error) {
	poolSize := cfg.PoolSize
	if poolSize <= 0 {
		poolSize = 50
	}
	minIdle := cfg.MinIdleConns
	if minIdle <= 0 {
		minIdle = 10
	}

	client := redis.NewClient(&redis.Options{
		Addr:         cfg.Addr(),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     poolSize,
		MinIdleConns: minIdle,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		logger.Log.Warnf("Redis ping failed (caching will fallback gracefully): %v", err)
	} else {
		logger.Log.Infof("Redis connected successfully at %s", cfg.Addr())
	}

	RDB = client
	return client, nil
}

// Session Cache Helpers
func SetSessionToken(ctx context.Context, token, userID string, duration time.Duration) error {
	if RDB == nil {
		return nil
	}
	return RDB.Set(ctx, fmt.Sprintf("session:%s", token), userID, duration).Err()
}

func GetSessionUser(ctx context.Context, token string) (string, error) {
	if RDB == nil {
		return "", nil
	}
	return RDB.Get(ctx, fmt.Sprintf("session:%s", token)).Result()
}

func DeleteSessionToken(ctx context.Context, token string) error {
	if RDB == nil {
		return nil
	}
	return RDB.Del(ctx, fmt.Sprintf("session:%s", token)).Err()
}

// QR Login Status Cache
func SetQRLoginState(ctx context.Context, sessionID string, statusJSON string, duration time.Duration) error {
	if RDB == nil {
		return nil
	}
	return RDB.Set(ctx, fmt.Sprintf("qr_login:%s", sessionID), statusJSON, duration).Err()
}

func GetQRLoginState(ctx context.Context, sessionID string) (string, error) {
	if RDB == nil {
		return "", nil
	}
	return RDB.Get(ctx, fmt.Sprintf("qr_login:%s", sessionID)).Result()
}
