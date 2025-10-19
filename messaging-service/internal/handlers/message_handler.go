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

type MessageHandler struct {
	messageService service.MessageService
	logger         *zap.Logger
}

func NewMessageHandler(messageService service.MessageService, logger *zap.Logger) *MessageHandler {
	return &MessageHandler{
		messageService: messageService,
		logger:         logger,
	}
}

// POST /api/messages
func (h *MessageHandler) CreateMessage(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		h.logger.Error("Failed to get user ID", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	h.logger.Info("Creating message for user", zap.String("user_id", userID))

	var req models.CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message, err := h.messageService.CreateMessage(c.Request.Context(), userID, &req)
	if err != nil {
		h.logger.Error("Failed to create message", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message"})
		return
	}

	h.logger.Info("Returning message to client",
		zap.String("message_id", message.ID.Hex()),
		zap.String("sender_id", message.SenderID),
		zap.String("content", message.Content),
	)

	middleware.IncrementMessagesProcessed()
	c.JSON(http.StatusCreated, gin.H{"data": message})
}

// PUT /api/messages/:id/read
func (h *MessageHandler) MarkMessageRead(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	messageID := c.Param("id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message ID required"})
		return
	}

	if err := h.messageService.MarkMessageAsRead(c.Request.Context(), messageID, userID); err != nil {
		h.logger.Error("Failed to mark message as read", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark message as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message marked as read"})
}

// GET /api/messages/conversations/:id
func (h *MessageHandler) GetConversationMessages(c *gin.Context) {
	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Conversation ID required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := h.messageService.GetConversationMessages(c.Request.Context(), conversationID, limit, offset)
	if err != nil {
		h.logger.Error("Failed to fetch messages", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	// Debug: Log the first few messages to see their sender_id
	for i, msg := range messages {
		if i < 3 { // Only log first 3 messages to avoid spam
			h.logger.Info("Retrieved message",
				zap.String("message_id", msg.ID.Hex()),
				zap.String("sender_id", msg.SenderID),
				zap.String("content", msg.Content),
			)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  messages,
		"count": len(messages),
	})
}
