package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/pulse/messaging-service/internal/config"
	"github.com/pulse/messaging-service/internal/handlers"
	"github.com/pulse/messaging-service/internal/middleware"
	"github.com/pulse/messaging-service/internal/repository"
	"github.com/pulse/messaging-service/internal/service"
	"github.com/pulse/messaging-service/internal/utils"
	"go.uber.org/zap"
)

func main() {
	// Load .env file if it exists
	godotenv.Load()

	// Load configuration
	cfg := config.Load()

	// Initialize logger
	logger, err := utils.NewLogger(cfg.Environment)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	logger.Info("Starting Messaging Service",
		zap.String("environment", cfg.Environment),
		zap.String("port", cfg.Port),
	)

	// Connect to MongoDB
	mongodb, err := config.ConnectMongoDB(cfg, logger)
	if err != nil {
		logger.Fatal("Failed to connect to MongoDB", zap.Error(err))
	}
	defer mongodb.Close(context.Background())

	// Connect to Redis
	redisClient, err := config.ConnectRedis(cfg, logger)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redisClient.Close()

	// Connect to RabbitMQ
	rabbitmq, err := config.ConnectRabbitMQ(cfg, logger)
	if err != nil {
		logger.Fatal("Failed to connect to RabbitMQ", zap.Error(err))
	}
	defer rabbitmq.Close()

	// Initialize repositories
	messageRepo := repository.NewMessageRepository(mongodb.Database)
	conversationRepo := repository.NewConversationRepository(mongodb.Database)
	userCacheRepo := repository.NewUserCacheRepository(mongodb.Database)
	presenceRepo := repository.NewPresenceRepository(redisClient)

	// Initialize services
	eventPublisher := service.NewEventPublisher(rabbitmq.Channel, logger)
	messageService := service.NewMessageService(messageRepo, conversationRepo, eventPublisher, logger)
	conversationService := service.NewConversationService(conversationRepo, logger)

	// Initialize handlers
	messageHandler := handlers.NewMessageHandler(messageService, logger)
	conversationHandler := handlers.NewConversationHandler(conversationService, logger)
	healthHandler := handlers.NewHealthHandler(mongodb, redisClient, logger)
	wsHandler := handlers.NewWebSocketHandler(messageService, presenceRepo, eventPublisher, logger, cfg.JWTSecret)

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.PrometheusMiddleware())

	// Health endpoints
	router.GET("/health", healthHandler.Health)
	router.GET("/ready", healthHandler.Ready)

	// Metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// WebSocket endpoint
	router.GET("/ws", wsHandler.HandleWebSocket)

	// API routes (protected)
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Message endpoints
		api.POST("/messages", messageHandler.CreateMessage)
		api.PUT("/messages/:id/read", messageHandler.MarkMessageRead)

		// Conversation endpoints
		api.GET("/messages/conversations", conversationHandler.GetConversations)
		api.GET("/messages/conversations/:id", conversationHandler.GetConversation)
		api.GET("/messages/conversations/:id/messages", messageHandler.GetConversationMessages)
		api.POST("/messages/group", conversationHandler.CreateGroup)
	}

	// Create HTTP server
	server := &http.Server{
		Addr:           ":" + cfg.Port,
		Handler:        router,
		ReadTimeout:    15 * time.Second,
		WriteTimeout:   15 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// Start server in goroutine
	go func() {
		logger.Info("Server starting", zap.String("port", cfg.Port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	logger.Info("Messaging Service is running",
		zap.String("port", cfg.Port),
		zap.String("environment", cfg.Environment),
	)

	// Log unused repositories (for future features)
	_ = userCacheRepo // Will be used when consuming user events

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server stopped gracefully")
}
