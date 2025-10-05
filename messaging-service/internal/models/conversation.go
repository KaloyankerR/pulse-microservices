package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ConversationType string

const (
	ConversationTypeDirect ConversationType = "DIRECT"
	ConversationTypeGroup  ConversationType = "GROUP"
)

type LastMessage struct {
	Content   string    `bson:"content" json:"content"`
	SenderID  string    `bson:"sender_id" json:"sender_id"`
	Timestamp time.Time `bson:"timestamp" json:"timestamp"`
}

type Conversation struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type         ConversationType   `bson:"type" json:"type"`
	Participants []string           `bson:"participants" json:"participants"`
	Name         string             `bson:"name,omitempty" json:"name,omitempty"`
	LastMessage  *LastMessage       `bson:"last_message,omitempty" json:"last_message,omitempty"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateConversationRequest struct {
	Type         ConversationType `json:"type" binding:"required,oneof=DIRECT GROUP"`
	Participants []string         `json:"participants" binding:"required,min=1"`
	Name         string           `json:"name"`
}

type CreateGroupRequest struct {
	Name         string   `json:"name" binding:"required,min=1,max=100"`
	Participants []string `json:"participants" binding:"required,min=2"`
}


