package repository

import (
	"context"
	"time"

	"github.com/pulse/messaging-service/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserCacheRepository interface {
	Upsert(ctx context.Context, user *models.UserCache) error
	GetByID(ctx context.Context, id string) (*models.UserCache, error)
	GetByIDs(ctx context.Context, ids []string) ([]*models.UserCache, error)
	Delete(ctx context.Context, id string) error
}

type userCacheRepository struct {
	collection *mongo.Collection
}

func NewUserCacheRepository(db *mongo.Database) UserCacheRepository {
	return &userCacheRepository{
		collection: db.Collection("user_cache"),
	}
}

func (r *userCacheRepository) Upsert(ctx context.Context, user *models.UserCache) error {
	user.LastSynced = time.Now()

	opts := options.Update().SetUpsert(true)
	filter := bson.M{"_id": user.ID}
	update := bson.M{"$set": user}

	_, err := r.collection.UpdateOne(ctx, filter, update, opts)
	return err
}

func (r *userCacheRepository) GetByID(ctx context.Context, id string) (*models.UserCache, error) {
	var user models.UserCache
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userCacheRepository) GetByIDs(ctx context.Context, ids []string) ([]*models.UserCache, error) {
	filter := bson.M{"_id": bson.M{"$in": ids}}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []*models.UserCache
	if err := cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *userCacheRepository) Delete(ctx context.Context, id string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}


