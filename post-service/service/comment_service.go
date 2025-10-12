package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/pulse/post-service-go/models"
	"github.com/pulse/post-service-go/repository"
	"github.com/sirupsen/logrus"
)

type CommentService struct {
	commentRepo *repository.CommentRepository
	postRepo    *repository.PostRepository
	userService *UserService
	logger      *logrus.Logger
}

func NewCommentService(
	commentRepo *repository.CommentRepository,
	postRepo *repository.PostRepository,
	userService *UserService,
	logger *logrus.Logger,
) *CommentService {
	return &CommentService{
		commentRepo: commentRepo,
		postRepo:    postRepo,
		userService: userService,
		logger:      logger,
	}
}

// CreateComment creates a new comment on a post
func (s *CommentService) CreateComment(ctx context.Context, postID, authorID uuid.UUID, req *models.CreateCommentRequest) (*models.CommentResponse, error) {
	// Verify post exists
	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return nil, fmt.Errorf("post not found")
	}
	if post == nil {
		return nil, fmt.Errorf("post not found")
	}

	// Create comment
	comment := &models.PostComment{
		ID:       uuid.New(),
		PostID:   postID,
		AuthorID: authorID,
		Content:  req.Content,
	}

	if err := s.commentRepo.CreateComment(ctx, comment); err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}

	// Get author information
	authors, err := s.userService.GetUsersByIDs([]uuid.UUID{authorID})
	if err != nil {
		s.logger.Warnf("Failed to get author info for comment: %v", err)
	}

	// Return comment response
	response := &models.CommentResponse{
		ID:        comment.ID,
		PostID:    comment.PostID,
		AuthorID:  comment.AuthorID,
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt,
		Author:    authors[authorID],
	}

	return response, nil
}

// GetCommentsByPostID retrieves all comments for a post
func (s *CommentService) GetCommentsByPostID(ctx context.Context, postID uuid.UUID) ([]models.CommentResponse, error) {
	comments, err := s.commentRepo.GetCommentsByPostID(ctx, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}

	// Get unique author IDs
	authorIDs := make([]uuid.UUID, 0)
	authorIDMap := make(map[uuid.UUID]bool)
	for _, comment := range comments {
		if !authorIDMap[comment.AuthorID] {
			authorIDs = append(authorIDs, comment.AuthorID)
			authorIDMap[comment.AuthorID] = true
		}
	}

	// Get author information
	authors, err := s.userService.GetUsersByIDs(authorIDs)
	if err != nil {
		s.logger.Warnf("Failed to get authors for comments: %v", err)
		authors = make(map[uuid.UUID]*models.UserCache)
	}

	// Convert to response format
	commentResponses := make([]models.CommentResponse, len(comments))
	for i, comment := range comments {
		commentResponses[i] = models.CommentResponse{
			ID:        comment.ID,
			PostID:    comment.PostID,
			AuthorID:  comment.AuthorID,
			Content:   comment.Content,
			CreatedAt: comment.CreatedAt,
			Author:    authors[comment.AuthorID],
		}
	}

	return commentResponses, nil
}

// DeleteComment deletes a comment
func (s *CommentService) DeleteComment(ctx context.Context, commentID, userID uuid.UUID) error {
	// Get comment to verify ownership
	comment, err := s.commentRepo.GetCommentByID(ctx, commentID)
	if err != nil {
		return err
	}

	// Check if user is the author
	if comment.AuthorID != userID {
		return fmt.Errorf("unauthorized to delete this comment")
	}

	// Delete comment
	if err := s.commentRepo.DeleteComment(ctx, commentID); err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	return nil
}
