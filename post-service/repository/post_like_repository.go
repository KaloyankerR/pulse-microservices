package repository

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/pulse/post-service-go/models"
	"github.com/sirupsen/logrus"
)

type PostLikeRepository struct {
	db     *sql.DB
	logger *logrus.Logger
}

func NewPostLikeRepository(db *sql.DB, logger *logrus.Logger) *PostLikeRepository {
	return &PostLikeRepository{
		db:     db,
		logger: logger,
	}
}

// LikePost adds a like to a post
func (r *PostLikeRepository) LikePost(postID, userID uuid.UUID) error {
	query := `
		INSERT INTO post_likes (id, post_id, user_id, created_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (post_id, user_id) DO NOTHING
	`

	_, err := r.db.Exec(query, uuid.New(), postID, userID)
	if err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}

	return nil
}

// UnlikePost removes a like from a post
func (r *PostLikeRepository) UnlikePost(postID, userID uuid.UUID) error {
	query := `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`

	result, err := r.db.Exec(query, postID, userID)
	if err != nil {
		return fmt.Errorf("failed to unlike post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("like not found")
	}

	return nil
}

// IsPostLikedByUser checks if a post is liked by a user
func (r *PostLikeRepository) IsPostLikedByUser(postID, userID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM post_likes 
			WHERE post_id = $1 AND user_id = $2
		)
	`

	var exists bool
	err := r.db.QueryRow(query, postID, userID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if post is liked: %w", err)
	}

	return exists, nil
}

// GetLikesByPost gets all likes for a specific post
func (r *PostLikeRepository) GetLikesByPost(postID uuid.UUID) ([]models.PostLike, error) {
	query := `
		SELECT id, post_id, user_id, created_at
		FROM post_likes
		WHERE post_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to query post likes: %w", err)
	}
	defer rows.Close()

	var likes []models.PostLike
	for rows.Next() {
		var like models.PostLike
		err := rows.Scan(&like.ID, &like.PostID, &like.UserID, &like.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post like: %w", err)
		}
		likes = append(likes, like)
	}

	return likes, nil
}
