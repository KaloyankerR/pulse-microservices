package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/pulse/post-service-go/models"
)

type CommentRepository struct {
	db *sql.DB
}

func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

// CreateComment creates a new comment
func (r *CommentRepository) CreateComment(ctx context.Context, comment *models.PostComment) error {
	query := `
		INSERT INTO post_comments (id, post_id, author_id, content, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING created_at
	`
	return r.db.QueryRowContext(
		ctx,
		query,
		comment.ID,
		comment.PostID,
		comment.AuthorID,
		comment.Content,
	).Scan(&comment.CreatedAt)
}

// GetCommentsByPostID retrieves all comments for a post
func (r *CommentRepository) GetCommentsByPostID(ctx context.Context, postID uuid.UUID) ([]models.PostComment, error) {
	query := `
		SELECT id, post_id, author_id, content, created_at
		FROM post_comments
		WHERE post_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}
	defer rows.Close()

	var comments []models.PostComment
	for rows.Next() {
		var comment models.PostComment
		if err := rows.Scan(&comment.ID, &comment.PostID, &comment.AuthorID, &comment.Content, &comment.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}
		comments = append(comments, comment)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating comments: %w", err)
	}

	return comments, nil
}

// GetCommentByID retrieves a single comment by ID
func (r *CommentRepository) GetCommentByID(ctx context.Context, commentID uuid.UUID) (*models.PostComment, error) {
	var comment models.PostComment
	query := `
		SELECT id, post_id, author_id, content, created_at
		FROM post_comments
		WHERE id = $1
	`
	err := r.db.QueryRowContext(ctx, query, commentID).Scan(
		&comment.ID,
		&comment.PostID,
		&comment.AuthorID,
		&comment.Content,
		&comment.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("comment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get comment: %w", err)
	}
	return &comment, nil
}

// DeleteComment deletes a comment by ID
func (r *CommentRepository) DeleteComment(ctx context.Context, commentID uuid.UUID) error {
	query := `DELETE FROM post_comments WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, commentID)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("comment not found")
	}

	return nil
}
