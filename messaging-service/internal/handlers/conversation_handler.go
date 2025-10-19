package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/pulse/messaging-service/internal/middleware"
	"github.com/pulse/messaging-service/internal/models"
	"github.com/pulse/messaging-service/internal/service"
	"go.uber.org/zap"
)

type ConversationHandler struct {
	conversationService service.ConversationService
	logger              *zap.Logger
}

func NewConversationHandler(conversationService service.ConversationService, logger *zap.Logger) *ConversationHandler {
	return &ConversationHandler{
		conversationService: conversationService,
		logger:              logger,
	}
}

// GET /api/messages/conversations
func (h *ConversationHandler) GetConversations(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	conversations, err := h.conversationService.GetUserConversations(c.Request.Context(), userID, limit, offset)
	if err != nil {
		h.logger.Error("Failed to fetch conversations", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  conversations,
		"count": len(conversations),
	})
}

// GET /api/messages/conversations/:id
func (h *ConversationHandler) GetConversation(c *gin.Context) {
	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Conversation ID required"})
		return
	}

	conversation, err := h.conversationService.GetConversation(c.Request.Context(), conversationID)
	if err != nil {
		h.logger.Error("Failed to fetch conversation", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": conversation})
}

// POST /api/messages/conversations
func (h *ConversationHandler) CreateConversation(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conversation, err := h.conversationService.CreateConversation(c.Request.Context(), userID, &req)
	if err != nil {
		h.logger.Error("Failed to create conversation", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": conversation})
}

// POST /api/messages/group
func (h *ConversationHandler) CreateGroup(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conversation, err := h.conversationService.CreateGroupConversation(c.Request.Context(), userID, &req)
	if err != nil {
		h.logger.Error("Failed to create group", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": conversation})
}
