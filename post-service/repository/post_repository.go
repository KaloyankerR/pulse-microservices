package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pulse/post-service-go/models"
	"github.com/sirupsen/logrus"
)

type PostRepository struct {
	db     *sql.DB
	logger *logrus.Logger
}

func NewPostRepository(db *sql.DB, logger *logrus.Logger) *PostRepository {
	return &PostRepository{
		db:     db,
		logger: logger,
	}
}

// GetAllPosts retrieves all posts with pagination
func (r *PostRepository) GetAllPosts(page, size int) ([]models.Post, error) {
	offset := page * size
	query := `
		SELECT id, author_id, content, event_id, like_count, comment_count, created_at, updated_at
		FROM posts
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(query, size, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts: %w", err)
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		err := rows.Scan(
			&post.ID, &post.AuthorID, &post.Content, &post.EventID,
			&post.LikeCount, &post.CommentCount, &post.CreatedAt, &post.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// GetPostByID retrieves a post by its ID
func (r *PostRepository) GetPostByID(id uuid.UUID) (*models.Post, error) {
	query := `
		SELECT id, author_id, content, event_id, like_count, comment_count, created_at, updated_at
		FROM posts
		WHERE id = $1
	`

	var post models.Post
	err := r.db.QueryRow(query, id).Scan(
		&post.ID, &post.AuthorID, &post.Content, &post.EventID,
		&post.LikeCount, &post.CommentCount, &post.CreatedAt, &post.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query post: %w", err)
	}

	return &post, nil
}

// GetPostsByAuthor retrieves posts by author ID with pagination
func (r *PostRepository) GetPostsByAuthor(authorID uuid.UUID, page, size int) ([]models.Post, error) {
	offset := page * size
	query := `
		SELECT id, author_id, content, event_id, like_count, comment_count, created_at, updated_at
		FROM posts
		WHERE author_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, authorID, size, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts by author: %w", err)
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		err := rows.Scan(
			&post.ID, &post.AuthorID, &post.Content, &post.EventID,
			&post.LikeCount, &post.CommentCount, &post.CreatedAt, &post.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// CreatePost creates a new post
func (r *PostRepository) CreatePost(post *models.Post) error {
	query := `
		INSERT INTO posts (id, author_id, content, event_id, like_count, comment_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	post.ID = uuid.New()
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()

	_, err := r.db.Exec(query,
		post.ID, post.AuthorID, post.Content, post.EventID,
		post.LikeCount, post.CommentCount, post.CreatedAt, post.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create post: %w", err)
	}

	return nil
}

// DeletePost deletes a post by ID
func (r *PostRepository) DeletePost(id uuid.UUID) error {
	query := `DELETE FROM posts WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("post not found")
	}

	return nil
}

// GetTotalPostsCount returns the total number of posts
func (r *PostRepository) GetTotalPostsCount() (int, error) {
	query := `SELECT COUNT(*) FROM posts`

	var count int
	err := r.db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count posts: %w", err)
	}

	return count, nil
}

// GetPostsCountByAuthor returns the total number of posts by an author
func (r *PostRepository) GetPostsCountByAuthor(authorID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM posts WHERE author_id = $1`

	var count int
	err := r.db.QueryRow(query, authorID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count posts by author: %w", err)
	}

	return count, nil
}
