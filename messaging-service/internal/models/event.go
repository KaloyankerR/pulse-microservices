package models

import "time"

// Event represents a message published to RabbitMQ
type Event struct {
	Type      string                 `json:"type"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

// WebSocket message types
type WSMessageType string

const (
	WSMessageTypeMessage       WSMessageType = "message"
	WSMessageTypeTyping        WSMessageType = "typing"
	WSMessageTypeRead          WSMessageType = "read"
	WSMessageTypePresence      WSMessageType = "presence"
	WSMessageTypeError         WSMessageType = "error"
	WSMessageTypeAuthenticated WSMessageType = "authenticated"
	WSMessageTypeNotification  WSMessageType = "notification"
)

type WSMessage struct {
	Type    WSMessageType `json:"type"`
	Payload interface{}   `json:"payload"`
}

// NotificationEvent represents a notification sent to WebSocket clients
type NotificationEvent struct {
	ID            string                 `json:"_id"`
	RecipientID   string                 `json:"recipient_id"`
	SenderID      string                 `json:"sender_id"`
	Type          string                 `json:"type"`
	Title         string                 `json:"title"`
	Message       string                 `json:"message"`
	ReferenceID   string                 `json:"reference_id"`
	ReferenceType string                 `json:"reference_type"`
	IsRead        bool                   `json:"is_read"`
	Priority      string                 `json:"priority"`
	CreatedAt     time.Time              `json:"created_at"`
	Metadata      map[string]interface{} `json:"metadata"`
	Sender        *UserInfo              `json:"sender,omitempty"`
}

type UserInfo struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatarUrl,omitempty"`
}
