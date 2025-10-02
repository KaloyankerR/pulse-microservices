package config

import (
	"context"
	"strings"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func ConnectRedis(cfg *Config, logger *zap.Logger) (*redis.Client, error) {
	// Parse Redis URL
	redisURL := cfg.RedisURL
	redisURL = strings.TrimPrefix(redisURL, "redis://")

	client := redis.NewClient(&redis.Options{
		Addr:         redisURL,
		Password:     "", // no password set
		DB:           0,  // use default DB
		PoolSize:     50,
		MinIdleConns: 10,
	})

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	logger.Info("Redis connected successfully")
	return client, nil
}
