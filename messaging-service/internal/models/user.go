package models

import (
	"time"
)

// UserCache maintains lightweight user info synced from User Service
type UserCache struct {
	ID          string    `bson:"_id" json:"id"`
	Username    string    `bson:"username" json:"username"`
	DisplayName string    `bson:"display_name" json:"display_name"`
	AvatarURL   string    `bson:"avatar_url" json:"avatar_url"`
	Verified    bool      `bson:"verified" json:"verified"`
	LastSynced  time.Time `bson:"last_synced" json:"last_synced"`
}

// UserPresence tracks real-time user online status
type UserPresence struct {
	UserID       string    `bson:"user_id" json:"user_id"`
	Status       string    `bson:"status" json:"status"` // online, away, offline
	LastSeen     time.Time `bson:"last_seen" json:"last_seen"`
	ConnectionID string    `bson:"connection_id,omitempty" json:"connection_id,omitempty"`
}

// TypingIndicator for real-time typing status
type TypingIndicator struct {
	ConversationID string    `json:"conversation_id"`
	UserID         string    `json:"user_id"`
	IsTyping       bool      `json:"is_typing"`
	Timestamp      time.Time `json:"timestamp"`
}
