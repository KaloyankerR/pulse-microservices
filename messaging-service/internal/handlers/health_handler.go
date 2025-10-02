package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pulse/messaging-service/internal/config"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type HealthHandler struct {
	mongodb *config.MongoDB
	redis   *redis.Client
	logger  *zap.Logger
}

func NewHealthHandler(mongodb *config.MongoDB, redis *redis.Client, logger *zap.Logger) *HealthHandler {
	return &HealthHandler{
		mongodb: mongodb,
		redis:   redis,
		logger:  logger,
	}
}

// GET /health
func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "messaging-service",
		"time":    time.Now().Format(time.RFC3339),
	})
}

// GET /ready
func (h *HealthHandler) Ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	status := gin.H{
		"service": "messaging-service",
		"ready":   true,
	}

	// Check MongoDB
	if err := h.mongodb.Client.Ping(ctx, nil); err != nil {
		h.logger.Error("MongoDB ping failed", zap.Error(err))
		status["ready"] = false
		status["mongodb"] = "unhealthy"
	} else {
		status["mongodb"] = "healthy"
	}

	// Check Redis
	if err := h.redis.Ping(ctx).Err(); err != nil {
		h.logger.Error("Redis ping failed", zap.Error(err))
		status["ready"] = false
		status["redis"] = "unhealthy"
	} else {
		status["redis"] = "healthy"
	}

	if status["ready"] == false {
		c.JSON(http.StatusServiceUnavailable, status)
		return
	}

	c.JSON(http.StatusOK, status)
}
