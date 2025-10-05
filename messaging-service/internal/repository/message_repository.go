package repository

import (
	"context"
	"time"

	"github.com/pulse/messaging-service/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MessageRepository interface {
	Create(ctx context.Context, message *models.Message) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.Message, error)
	GetByConversationID(ctx context.Context, conversationID primitive.ObjectID, limit, offset int) ([]*models.Message, error)
	MarkAsRead(ctx context.Context, messageID primitive.ObjectID, userID string) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type messageRepository struct {
	collection *mongo.Collection
}

func NewMessageRepository(db *mongo.Database) MessageRepository {
	return &messageRepository{
		collection: db.Collection("messages"),
	}
}

func (r *messageRepository) Create(ctx context.Context, message *models.Message) error {
	message.CreatedAt = time.Now()
	message.DeliveryStatus = models.DeliveryStatus{
		ReadBy: []models.ReadReceipt{},
	}

	result, err := r.collection.InsertOne(ctx, message)
	if err != nil {
		return err
	}

	message.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *messageRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Message, error) {
	var message models.Message
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&message)
	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (r *messageRepository) GetByConversationID(ctx context.Context, conversationID primitive.ObjectID, limit, offset int) ([]*models.Message, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(int64(limit)).
		SetSkip(int64(offset))

	cursor, err := r.collection.Find(ctx, bson.M{"conversation_id": conversationID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []*models.Message
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, err
	}

	return messages, nil
}

func (r *messageRepository) MarkAsRead(ctx context.Context, messageID primitive.ObjectID, userID string) error {
	readReceipt := models.ReadReceipt{
		UserID: userID,
		ReadAt: time.Now(),
	}

	update := bson.M{
		"$addToSet": bson.M{
			"delivery_status.read_by": readReceipt,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": messageID}, update)
	return err
}

func (r *messageRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}


