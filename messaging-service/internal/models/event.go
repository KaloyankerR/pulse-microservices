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
)

type WSMessage struct {
	Type    WSMessageType `json:"type"`
	Payload interface{}   `json:"payload"`
}


