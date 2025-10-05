package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MessageType string

const (
	MessageTypeText   MessageType = "TEXT"
	MessageTypeSystem MessageType = "SYSTEM"
)

type DeliveryStatus struct {
	ReadBy []ReadReceipt `bson:"read_by" json:"read_by"`
}

type ReadReceipt struct {
	UserID string    `bson:"user_id" json:"user_id"`
	ReadAt time.Time `bson:"read_at" json:"read_at"`
}

type Message struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ConversationID primitive.ObjectID `bson:"conversation_id" json:"conversation_id"`
	SenderID       string             `bson:"sender_id" json:"sender_id"`
	Content        string             `bson:"content" json:"content"`
	MessageType    MessageType        `bson:"message_type" json:"message_type"`
	Mentions       []string           `bson:"mentions" json:"mentions"`
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
	DeliveryStatus DeliveryStatus     `bson:"delivery_status" json:"delivery_status"`
}

type CreateMessageRequest struct {
	ConversationID string   `json:"conversation_id" binding:"required"`
	Content        string   `json:"content" binding:"required,min=1,max=5000"`
	Mentions       []string `json:"mentions"`
}

type MarkReadRequest struct {
	UserID string `json:"user_id"`
}


