package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	presenceKeyPrefix = "presence:"
	presenceTTL       = 5 * time.Minute
)

type PresenceRepository interface {
	SetOnline(ctx context.Context, userID, connectionID string) error
	SetOffline(ctx context.Context, userID string) error
	IsOnline(ctx context.Context, userID string) (bool, error)
	GetStatus(ctx context.Context, userID string) (string, error)
	UpdateHeartbeat(ctx context.Context, userID string) error
}

type presenceRepository struct {
	redis *redis.Client
}

func NewPresenceRepository(redis *redis.Client) PresenceRepository {
	return &presenceRepository{
		redis: redis,
	}
}

func (r *presenceRepository) SetOnline(ctx context.Context, userID, connectionID string) error {
	key := presenceKeyPrefix + userID
	data := map[string]interface{}{
		"status":        "online",
		"last_seen":     time.Now().Unix(),
		"connection_id": connectionID,
	}

	return r.redis.HSet(ctx, key, data).Err()
}

func (r *presenceRepository) SetOffline(ctx context.Context, userID string) error {
	key := presenceKeyPrefix + userID
	data := map[string]interface{}{
		"status":    "offline",
		"last_seen": time.Now().Unix(),
	}

	return r.redis.HSet(ctx, key, data).Err()
}

func (r *presenceRepository) IsOnline(ctx context.Context, userID string) (bool, error) {
	key := presenceKeyPrefix + userID
	status, err := r.redis.HGet(ctx, key, "status").Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return status == "online", nil
}

func (r *presenceRepository) GetStatus(ctx context.Context, userID string) (string, error) {
	key := presenceKeyPrefix + userID
	status, err := r.redis.HGet(ctx, key, "status").Result()
	if err == redis.Nil {
		return "offline", nil
	}
	if err != nil {
		return "", err
	}

	return status, nil
}

func (r *presenceRepository) UpdateHeartbeat(ctx context.Context, userID string) error {
	key := presenceKeyPrefix + userID
	exists, err := r.redis.Exists(ctx, key).Result()
	if err != nil {
		return err
	}

	if exists == 0 {
		return fmt.Errorf("user presence not found")
	}

	return r.redis.HSet(ctx, key, "last_seen", time.Now().Unix()).Err()
}


