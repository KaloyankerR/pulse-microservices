package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/pulse/messaging-service/internal/models"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

// WebSocketNotificationSender interface to avoid import cycle
type WebSocketNotificationSender interface {
	SendNotification(notification *models.NotificationEvent)
}

type NotificationConsumer struct {
	channel   *amqp.Channel
	wsHandler WebSocketNotificationSender
	logger    *zap.Logger
}

func NewNotificationConsumer(channel *amqp.Channel, wsHandler WebSocketNotificationSender, logger *zap.Logger) *NotificationConsumer {
	return &NotificationConsumer{
		channel:   channel,
		wsHandler: wsHandler,
		logger:    logger,
	}
}

func (nc *NotificationConsumer) StartConsuming() error {
	// Declare the notification events exchange
	err := nc.channel.ExchangeDeclare(
		"notification_events", // name
		"topic",               // type
		true,                  // durable
		false,                 // auto-deleted
		false,                 // internal
		false,                 // no-wait
		nil,                   // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare notification_events exchange: %w", err)
	}

	// Declare a queue for this service
	queue, err := nc.channel.QueueDeclare(
		"messaging_notifications", // name
		true,                      // durable
		false,                     // delete when unused
		false,                     // exclusive
		false,                     // no-wait
		nil,                       // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	// Bind the queue to the exchange with routing key for notification events
	err = nc.channel.QueueBind(
		queue.Name,            // queue name
		"notification.*",      // routing key
		"notification_events", // exchange
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to bind queue: %w", err)
	}

	// Start consuming messages
	msgs, err := nc.channel.Consume(
		queue.Name, // queue
		"",         // consumer
		true,       // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // args
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	nc.logger.Info("Started consuming notification events")

	// Process messages in a goroutine
	go nc.processMessages(msgs)

	return nil
}

func (nc *NotificationConsumer) processMessages(msgs <-chan amqp.Delivery) {
	for msg := range msgs {
		nc.processMessage(msg)
	}
}

func (nc *NotificationConsumer) processMessage(msg amqp.Delivery) {
	var event models.Event
	if err := json.Unmarshal(msg.Body, &event); err != nil {
		nc.logger.Error("Failed to unmarshal notification event", zap.Error(err))
		return
	}

	nc.logger.Debug("Received notification event",
		zap.String("event_type", event.Type),
		zap.Time("timestamp", event.Timestamp),
	)

	switch event.Type {
	case "notification.created":
		nc.handleNotificationCreated(event.Data)
	default:
		nc.logger.Debug("Ignoring unknown notification event type", zap.String("type", event.Type))
	}
}

func (nc *NotificationConsumer) handleNotificationCreated(data map[string]interface{}) {
	// Convert the event data to NotificationEvent
	notification := &models.NotificationEvent{
		ID:            getString(data, "_id"),
		RecipientID:   getString(data, "recipient_id"),
		SenderID:      getString(data, "sender_id"),
		Type:          getString(data, "type"),
		Title:         getString(data, "title"),
		Message:       getString(data, "message"),
		ReferenceID:   getString(data, "reference_id"),
		ReferenceType: getString(data, "reference_type"),
		Priority:      getString(data, "priority"),
		Metadata:      getMap(data, "metadata"),
	}

	// Parse created_at timestamp
	if createdAtStr := getString(data, "created_at"); createdAtStr != "" {
		if createdAt, err := time.Parse(time.RFC3339, createdAtStr); err == nil {
			notification.CreatedAt = createdAt
		} else {
			notification.CreatedAt = time.Now()
		}
	} else {
		notification.CreatedAt = time.Now()
	}

	// Parse sender information if available
	if senderData := getMap(data, "sender"); senderData != nil {
		notification.Sender = &models.UserInfo{
			ID:        getString(senderData, "id"),
			Username:  getString(senderData, "username"),
			AvatarURL: getString(senderData, "avatarUrl"),
		}
	}

	// Send notification to WebSocket handler
	nc.wsHandler.SendNotification(notification)

	nc.logger.Info("Processed notification event",
		zap.String("notification_id", notification.ID),
		zap.String("recipient_id", notification.RecipientID),
		zap.String("type", notification.Type),
	)
}

// Helper functions to safely extract values from map[string]interface{}
func getString(data map[string]interface{}, key string) string {
	if val, ok := data[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getMap(data map[string]interface{}, key string) map[string]interface{} {
	if val, ok := data[key]; ok {
		if m, ok := val.(map[string]interface{}); ok {
			return m
		}
	}
	return nil
}
