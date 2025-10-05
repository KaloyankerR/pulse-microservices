package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/pulse/messaging-service/internal/middleware"
	"github.com/pulse/messaging-service/internal/models"
	"github.com/pulse/messaging-service/internal/repository"
	"github.com/pulse/messaging-service/internal/service"
	"go.uber.org/zap"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type WebSocketHandler struct {
	messageService  service.MessageService
	presenceRepo    repository.PresenceRepository
	eventPublisher  *service.EventPublisher
	logger          *zap.Logger
	jwtSecret       string
	clients         map[string]*Client
	clientsMutex    sync.RWMutex
	broadcast       chan *models.WSMessage
	typingIndicator chan *models.TypingIndicator
}

type Client struct {
	ID         string
	UserID     string
	Conn       *websocket.Conn
	Send       chan *models.WSMessage
	handler    *WebSocketHandler
	pingTicker *time.Ticker
}

func NewWebSocketHandler(
	messageService service.MessageService,
	presenceRepo repository.PresenceRepository,
	eventPublisher *service.EventPublisher,
	logger *zap.Logger,
	jwtSecret string,
) *WebSocketHandler {
	handler := &WebSocketHandler{
		messageService:  messageService,
		presenceRepo:    presenceRepo,
		eventPublisher:  eventPublisher,
		logger:          logger,
		jwtSecret:       jwtSecret,
		clients:         make(map[string]*Client),
		broadcast:       make(chan *models.WSMessage, 256),
		typingIndicator: make(chan *models.TypingIndicator, 256),
	}

	// Start broadcast goroutine
	go handler.handleBroadcast()
	go handler.handleTypingIndicators()

	return handler
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	// Authenticate via query parameter token
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
		return
	}

	// Validate JWT
	claims := &middleware.Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})

	if err != nil || !parsedToken.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Upgrade connection
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		h.logger.Error("Failed to upgrade connection", zap.Error(err))
		return
	}

	// Create client
	client := &Client{
		ID:      fmt.Sprintf("%s-%d", claims.UserID, time.Now().UnixNano()),
		UserID:  claims.UserID,
		Conn:    conn,
		Send:    make(chan *models.WSMessage, 256),
		handler: h,
	}

	// Register client
	h.registerClient(client)

	// Set user as online
	ctx := context.Background()
	h.presenceRepo.SetOnline(ctx, client.UserID, client.ID)
	h.eventPublisher.PublishUserOnline(client.UserID)

	// Send authentication confirmation
	client.Send <- &models.WSMessage{
		Type: models.WSMessageTypeAuthenticated,
		Payload: map[string]interface{}{
			"user_id":   client.UserID,
			"connected": true,
		},
	}

	middleware.IncrementActiveConnections()

	// Start read and write pumps
	go client.writePump()
	go client.readPump()
}

func (h *WebSocketHandler) registerClient(client *Client) {
	h.clientsMutex.Lock()
	defer h.clientsMutex.Unlock()
	h.clients[client.ID] = client
	h.logger.Info("Client connected", zap.String("client_id", client.ID), zap.String("user_id", client.UserID))
}

func (h *WebSocketHandler) unregisterClient(client *Client) {
	h.clientsMutex.Lock()
	defer h.clientsMutex.Unlock()

	if _, ok := h.clients[client.ID]; ok {
		delete(h.clients, client.ID)
		close(client.Send)

		// Set user as offline
		ctx := context.Background()
		h.presenceRepo.SetOffline(ctx, client.UserID)
		h.eventPublisher.PublishUserOffline(client.UserID)

		middleware.DecrementActiveConnections()
		h.logger.Info("Client disconnected", zap.String("client_id", client.ID), zap.String("user_id", client.UserID))
	}
}

func (h *WebSocketHandler) handleBroadcast() {
	for message := range h.broadcast {
		h.clientsMutex.RLock()
		for _, client := range h.clients {
			select {
			case client.Send <- message:
			default:
				// Client buffer full, skip
			}
		}
		h.clientsMutex.RUnlock()
	}
}

func (h *WebSocketHandler) handleTypingIndicators() {
	for indicator := range h.typingIndicator {
		// Send typing indicator to relevant conversation participants
		h.clientsMutex.RLock()
		for _, client := range h.clients {
			// Don't send to the sender
			if client.UserID != indicator.UserID {
				select {
				case client.Send <- &models.WSMessage{
					Type:    models.WSMessageTypeTyping,
					Payload: indicator,
				}:
				default:
				}
			}
		}
		h.clientsMutex.RUnlock()
	}
}

// Client read pump
func (c *Client) readPump() {
	defer func() {
		c.handler.unregisterClient(c)
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.handler.logger.Error("WebSocket error", zap.Error(err))
			}
			break
		}

		// Parse message
		var wsMsg models.WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			c.handler.logger.Warn("Invalid message format", zap.Error(err))
			continue
		}

		// Handle different message types
		switch wsMsg.Type {
		case models.WSMessageTypeTyping:
			// Handle typing indicator
			if indicator, ok := wsMsg.Payload.(map[string]interface{}); ok {
				c.handler.typingIndicator <- &models.TypingIndicator{
					ConversationID: indicator["conversation_id"].(string),
					UserID:         c.UserID,
					IsTyping:       indicator["is_typing"].(bool),
					Timestamp:      time.Now(),
				}
			}
		}
	}
}

// Client write pump
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Send JSON message
			if err := c.Conn.WriteJSON(message); err != nil {
				c.handler.logger.Error("Failed to write message", zap.Error(err))
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}


