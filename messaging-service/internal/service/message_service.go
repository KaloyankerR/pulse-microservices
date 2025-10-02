package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/pulse/messaging-service/internal/models"
	"github.com/pulse/messaging-service/internal/repository"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.uber.org/zap"
)

type MessageService interface {
	CreateMessage(ctx context.Context, userID string, req *models.CreateMessageRequest) (*models.Message, error)
	GetMessage(ctx context.Context, messageID string) (*models.Message, error)
	GetConversationMessages(ctx context.Context, conversationID string, limit, offset int) ([]*models.Message, error)
	MarkMessageAsRead(ctx context.Context, messageID, userID string) error
}

type messageService struct {
	messageRepo      repository.MessageRepository
	conversationRepo repository.ConversationRepository
	eventPublisher   *EventPublisher
	logger           *zap.Logger
}

func NewMessageService(
	messageRepo repository.MessageRepository,
	conversationRepo repository.ConversationRepository,
	eventPublisher *EventPublisher,
	logger *zap.Logger,
) MessageService {
	return &messageService{
		messageRepo:      messageRepo,
		conversationRepo: conversationRepo,
		eventPublisher:   eventPublisher,
		logger:           logger,
	}
}

func (s *messageService) CreateMessage(ctx context.Context, userID string, req *models.CreateMessageRequest) (*models.Message, error) {
	// Parse conversation ID
	convID, err := primitive.ObjectIDFromHex(req.ConversationID)
	if err != nil {
		return nil, fmt.Errorf("invalid conversation ID: %w", err)
	}

	// Verify conversation exists and user is participant
	conversation, err := s.conversationRepo.GetByID(ctx, convID)
	if err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant
	isParticipant := false
	for _, p := range conversation.Participants {
		if p == userID {
			isParticipant = true
			break
		}
	}
	if !isParticipant {
		return nil, fmt.Errorf("user is not a participant in this conversation")
	}

	// Create message
	message := &models.Message{
		ConversationID: convID,
		SenderID:       userID,
		Content:        req.Content,
		MessageType:    models.MessageTypeText,
		Mentions:       req.Mentions,
	}

	if err := s.messageRepo.Create(ctx, message); err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Update conversation's last message
	lastMessage := &models.LastMessage{
		Content:   message.Content,
		SenderID:  message.SenderID,
		Timestamp: message.CreatedAt,
	}
	if err := s.conversationRepo.UpdateLastMessage(ctx, convID, lastMessage); err != nil {
		s.logger.Warn("Failed to update last message", zap.Error(err))
	}

	// Publish event
	if s.eventPublisher != nil {
		s.eventPublisher.PublishMessageSent(message, conversation.Participants)
	}

	s.logger.Info("Message created",
		zap.String("message_id", message.ID.Hex()),
		zap.String("conversation_id", req.ConversationID),
		zap.String("sender_id", userID),
	)

	return message, nil
}

func (s *messageService) GetMessage(ctx context.Context, messageID string) (*models.Message, error) {
	id, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return nil, fmt.Errorf("invalid message ID: %w", err)
	}

	message, err := s.messageRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("message not found: %w", err)
	}

	return message, nil
}

func (s *messageService) GetConversationMessages(ctx context.Context, conversationID string, limit, offset int) ([]*models.Message, error) {
	convID, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		return nil, fmt.Errorf("invalid conversation ID: %w", err)
	}

	// Set default pagination
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	messages, err := s.messageRepo.GetByConversationID(ctx, convID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages: %w", err)
	}

	return messages, nil
}

func (s *messageService) MarkMessageAsRead(ctx context.Context, messageID, userID string) error {
	id, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return fmt.Errorf("invalid message ID: %w", err)
	}

	if err := s.messageRepo.MarkAsRead(ctx, id, userID); err != nil {
		return fmt.Errorf("failed to mark message as read: %w", err)
	}

	// Publish event
	if s.eventPublisher != nil {
		s.eventPublisher.PublishMessageRead(messageID, userID)
	}

	s.logger.Info("Message marked as read",
		zap.String("message_id", messageID),
		zap.String("user_id", userID),
	)

	return nil
}

// EventPublisher handles publishing events to RabbitMQ
type EventPublisher struct {
	channel *amqp.Channel
	logger  *zap.Logger
}

func NewEventPublisher(channel *amqp.Channel, logger *zap.Logger) *EventPublisher {
	return &EventPublisher{
		channel: channel,
		logger:  logger,
	}
}

func (e *EventPublisher) PublishMessageSent(message *models.Message, participants []string) {
	event := models.Event{
		Type:      "message.sent",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"message_id":      message.ID.Hex(),
			"conversation_id": message.ConversationID.Hex(),
			"sender_id":       message.SenderID,
			"content":         message.Content,
			"participants":    participants,
			"created_at":      message.CreatedAt,
		},
	}

	e.publish("message.sent", event)
}

func (e *EventPublisher) PublishMessageRead(messageID, userID string) {
	event := models.Event{
		Type:      "message.read",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"message_id": messageID,
			"user_id":    userID,
			"read_at":    time.Now(),
		},
	}

	e.publish("message.read", event)
}

func (e *EventPublisher) PublishUserOnline(userID string) {
	event := models.Event{
		Type:      "user.online",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"user_id":   userID,
			"status":    "online",
			"timestamp": time.Now(),
		},
	}

	e.publish("user.online", event)
}

func (e *EventPublisher) PublishUserOffline(userID string) {
	event := models.Event{
		Type:      "user.offline",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"user_id":   userID,
			"status":    "offline",
			"timestamp": time.Now(),
		},
	}

	e.publish("user.offline", event)
}

func (e *EventPublisher) publish(routingKey string, event models.Event) {
	body, err := json.Marshal(event)
	if err != nil {
		e.logger.Error("Failed to marshal event", zap.Error(err))
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = e.channel.PublishWithContext(
		ctx,
		"messaging_events", // exchange
		routingKey,         // routing key
		false,              // mandatory
		false,              // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
			Timestamp:   time.Now(),
		},
	)

	if err != nil {
		e.logger.Error("Failed to publish event",
			zap.String("routing_key", routingKey),
			zap.Error(err),
		)
	} else {
		e.logger.Debug("Event published",
			zap.String("type", event.Type),
			zap.String("routing_key", routingKey),
		)
	}
}
