package config

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func ConnectMongoDB(cfg *Config, logger *zap.Logger) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(cfg.MongoDBURL).
		SetMaxPoolSize(50).
		SetMinPoolSize(10).
		SetMaxConnIdleTime(30 * time.Second)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	logger.Info("MongoDB connected successfully", zap.String("database", cfg.MongoDBName))

	db := client.Database(cfg.MongoDBName)

	// Create indexes
	if err := createIndexes(ctx, db, logger); err != nil {
		logger.Warn("Failed to create indexes", zap.Error(err))
	}

	return &MongoDB{
		Client:   client,
		Database: db,
	}, nil
}

func createIndexes(ctx context.Context, db *mongo.Database, logger *zap.Logger) error {
	// Messages collection indexes
	messagesCol := db.Collection("messages")
	_, err := messagesCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "conversation_id", Value: 1}, {Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "sender_id", Value: 1}},
		},
	})
	if err != nil {
		return err
	}

	// Conversations collection indexes
	conversationsCol := db.Collection("conversations")
	_, err = conversationsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "participants", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "last_message.timestamp", Value: -1}},
		},
	})
	if err != nil {
		return err
	}

	// User presence collection
	presenceCol := db.Collection("user_presence")
	_, err = presenceCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	logger.Info("MongoDB indexes created successfully")
	return err
}

func (m *MongoDB) Close(ctx context.Context) error {
	return m.Client.Disconnect(ctx)
}
