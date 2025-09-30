package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Post represents a post in the system following DATABASE&SCHEMAS.md
type Post struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	AuthorID     uuid.UUID  `json:"authorId" db:"author_id"`
	Content      string     `json:"content" db:"content"`
	EventID      *uuid.UUID `json:"eventId,omitempty" db:"event_id"`
	LikeCount    int        `json:"likeCount" db:"like_count"`
	CommentCount int        `json:"commentCount" db:"comment_count"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time  `json:"updatedAt" db:"updated_at"`
}

// PostLike represents a like on a post following DATABASE&SCHEMAS.md
type PostLike struct {
	ID        uuid.UUID `json:"id" db:"id"`
	PostID    uuid.UUID `json:"postId" db:"post_id"`
	UserID    uuid.UUID `json:"userId" db:"user_id"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// UserCache represents cached user data following DATABASE&SCHEMAS.md
type UserCache struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Username    string    `json:"username" db:"username"`
	DisplayName *string   `json:"displayName,omitempty" db:"display_name"`
	AvatarURL   *string   `json:"avatarUrl,omitempty" db:"avatar_url"`
	Verified    bool      `json:"verified" db:"verified"`
	LastSynced  time.Time `json:"lastSynced" db:"last_synced"`
	UpdatedAt   time.Time `json:"updatedAt" db:"updated_at"`
}

// CreatePostRequest represents the request to create a new post
type CreatePostRequest struct {
	Content string     `json:"content" validate:"required,max=280"`
	EventID *uuid.UUID `json:"eventId,omitempty"`
}

// PostResponse represents the response for a post with author information
type PostResponse struct {
	ID           uuid.UUID  `json:"id"`
	AuthorID     uuid.UUID  `json:"authorId"`
	Content      string     `json:"content"`
	EventID      *uuid.UUID `json:"eventId,omitempty"`
	LikeCount    int        `json:"likeCount"`
	CommentCount int        `json:"commentCount"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	Author       *UserCache `json:"author,omitempty"`
	IsLiked      bool       `json:"isLiked,omitempty"`
}

// PaginatedPostsResponse represents a paginated response for posts
type PaginatedPostsResponse struct {
	Posts      []PostResponse `json:"posts"`
	Page       int            `json:"page"`
	Size       int            `json:"size"`
	TotalPosts int            `json:"totalPosts"`
	TotalPages int            `json:"totalPages"`
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
