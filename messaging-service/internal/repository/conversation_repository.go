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

type ConversationRepository interface {
	Create(ctx context.Context, conversation *models.Conversation) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.Conversation, error)
	GetByUserID(ctx context.Context, userID string, limit, offset int) ([]*models.Conversation, error)
	FindDirectConversation(ctx context.Context, user1, user2 string) (*models.Conversation, error)
	UpdateLastMessage(ctx context.Context, id primitive.ObjectID, lastMessage *models.LastMessage) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type conversationRepository struct {
	collection *mongo.Collection
}

func NewConversationRepository(db *mongo.Database) ConversationRepository {
	return &conversationRepository{
		collection: db.Collection("conversations"),
	}
}

func (r *conversationRepository) Create(ctx context.Context, conversation *models.Conversation) error {
	conversation.CreatedAt = time.Now()
	conversation.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, conversation)
	if err != nil {
		return err
	}

	conversation.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *conversationRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Conversation, error) {
	var conversation models.Conversation
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&conversation)
	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *conversationRepository) GetByUserID(ctx context.Context, userID string, limit, offset int) ([]*models.Conversation, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "last_message.timestamp", Value: -1}}).
		SetLimit(int64(limit)).
		SetSkip(int64(offset))

	filter := bson.M{
		"$and": []bson.M{
			{"participants": userID},
			{"participants": bson.M{"$ne": ""}}, // Exclude conversations with empty participant strings
		},
	}

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var conversations []*models.Conversation
	if err := cursor.All(ctx, &conversations); err != nil {
		return nil, err
	}

	return conversations, nil
}

func (r *conversationRepository) FindDirectConversation(ctx context.Context, user1, user2 string) (*models.Conversation, error) {
	filter := bson.M{
		"type": models.ConversationTypeDirect,
		"participants": bson.M{
			"$all":  []string{user1, user2},
			"$size": 2,
		},
	}

	var conversation models.Conversation
	err := r.collection.FindOne(ctx, filter).Decode(&conversation)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &conversation, nil
}

func (r *conversationRepository) UpdateLastMessage(ctx context.Context, id primitive.ObjectID, lastMessage *models.LastMessage) error {
	update := bson.M{
		"$set": bson.M{
			"last_message": lastMessage,
			"updated_at":   time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

func (r *conversationRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
