package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Post represents a post in the system following DATABASE&SCHEMAS.md
type Post struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	AuthorID     uuid.UUID  `json:"author_id" db:"author_id"`
	Content      string     `json:"content" db:"content"`
	EventID      *uuid.UUID `json:"event_id,omitempty" db:"event_id"`
	LikeCount    int        `json:"like_count" db:"like_count"`
	CommentCount int        `json:"comment_count" db:"comment_count"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// PostLike represents a like on a post following DATABASE&SCHEMAS.md
type PostLike struct {
	ID        uuid.UUID `json:"id" db:"id"`
	PostID    uuid.UUID `json:"post_id" db:"post_id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// PostComment represents a comment on a post
type PostComment struct {
	ID        uuid.UUID `json:"id" db:"id"`
	PostID    uuid.UUID `json:"post_id" db:"post_id"`
	AuthorID  uuid.UUID `json:"author_id" db:"author_id"`
	Content   string    `json:"content" db:"content"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// UserCache represents cached user data following DATABASE&SCHEMAS.md
type UserCache struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Username    string    `json:"username" db:"username"`
	DisplayName *string   `json:"display_name,omitempty" db:"display_name"`
	AvatarURL   *string   `json:"avatar_url,omitempty" db:"avatar_url"`
	Verified    bool      `json:"verified" db:"verified"`
	LastSynced  time.Time `json:"last_synced" db:"last_synced"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreatePostRequest represents the request to create a new post
type CreatePostRequest struct {
	Content string     `json:"content" validate:"required,max=280"`
	EventID *uuid.UUID `json:"event_id,omitempty"`
}

// PostResponse represents the response for a post with author information
type PostResponse struct {
	ID           uuid.UUID  `json:"id"`
	AuthorID     uuid.UUID  `json:"author_id"`
	Content      string     `json:"content"`
	EventID      *uuid.UUID `json:"event_id,omitempty"`
	LikeCount    int        `json:"likes_count"`
	CommentCount int        `json:"comments_count"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	Author       *UserCache `json:"author,omitempty"`
	IsLiked      bool       `json:"is_liked,omitempty"`
}

// PaginatedPostsResponse represents a paginated response for posts
type PaginatedPostsResponse struct {
	Posts      []PostResponse `json:"posts"`
	Page       int            `json:"page"`
	Size       int            `json:"size"`
	TotalPosts int            `json:"total_posts"`
	TotalPages int            `json:"total_pages"`
}

// CreateCommentRequest represents the request to create a new comment
type CreateCommentRequest struct {
	Content string `json:"content" validate:"required,max=500"`
}

// CommentResponse represents the response for a comment with author information
type CommentResponse struct {
	ID        uuid.UUID  `json:"id"`
	PostID    uuid.UUID  `json:"post_id"`
	AuthorID  uuid.UUID  `json:"author_id"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	Author    *UserCache `json:"author,omitempty"`
}

// JWTClaims represents the JWT token claims from user-service
type JWTClaims struct {
	Iss      string `json:"iss"`
	Sub      string `json:"sub"`
	ID       string `json:"id"`
	UserID   string `json:"userId"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// GetAudience implements jwt.Claims interface
func (c *JWTClaims) GetAudience() (jwt.ClaimStrings, error) {
	return c.Audience, nil
}

// GetExpirationTime implements jwt.Claims interface
func (c *JWTClaims) GetExpirationTime() (*jwt.NumericDate, error) {
	return c.ExpiresAt, nil
}

// GetIssuedAt implements jwt.Claims interface
func (c *JWTClaims) GetIssuedAt() (*jwt.NumericDate, error) {
	return c.IssuedAt, nil
}

// GetNotBefore implements jwt.Claims interface
func (c *JWTClaims) GetNotBefore() (*jwt.NumericDate, error) {
	return c.NotBefore, nil
}

// GetIssuer implements jwt.Claims interface
func (c *JWTClaims) GetIssuer() (string, error) {
	return c.Issuer, nil
}

// GetSubject implements jwt.Claims interface
func (c *JWTClaims) GetSubject() (string, error) {
	return c.Subject, nil
}
