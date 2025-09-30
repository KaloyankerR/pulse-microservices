package service

import (
	"fmt"
	"math"

	"github.com/google/uuid"
	"github.com/pulse/post-service-go/models"
	"github.com/pulse/post-service-go/repository"
	"github.com/sirupsen/logrus"
)

type PostService struct {
	postRepo     *repository.PostRepository
	postLikeRepo *repository.PostLikeRepository
	userService  *UserService
	logger       *logrus.Logger
}

func NewPostService(
	postRepo *repository.PostRepository,
	postLikeRepo *repository.PostLikeRepository,
	userService *UserService,
	logger *logrus.Logger,
) *PostService {
	return &PostService{
		postRepo:     postRepo,
		postLikeRepo: postLikeRepo,
		userService:  userService,
		logger:       logger,
	}
}

// GetAllPosts retrieves all posts with pagination and author information
func (s *PostService) GetAllPosts(page, size int, currentUserID *uuid.UUID) (*models.PaginatedPostsResponse, error) {
	posts, err := s.postRepo.GetAllPosts(page, size)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}

	totalPosts, err := s.postRepo.GetTotalPostsCount()
	if err != nil {
		return nil, fmt.Errorf("failed to get total posts count: %w", err)
	}

	// Get unique author IDs
	authorIDs := make([]uuid.UUID, 0)
	authorIDMap := make(map[uuid.UUID]bool)
	for _, post := range posts {
		if !authorIDMap[post.AuthorID] {
			authorIDs = append(authorIDs, post.AuthorID)
			authorIDMap[post.AuthorID] = true
		}
	}

	// Get author information
	authors, err := s.userService.GetUsersByIDs(authorIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get authors: %w", err)
	}

	// Convert to response format
	postResponses := make([]models.PostResponse, len(posts))
	for i, post := range posts {
		response := models.PostResponse{
			ID:           post.ID,
			AuthorID:     post.AuthorID,
			Content:      post.Content,
			EventID:      post.EventID,
			LikeCount:    post.LikeCount,
			CommentCount: post.CommentCount,
			CreatedAt:    post.CreatedAt,
			UpdatedAt:    post.UpdatedAt,
			Author:       authors[post.AuthorID],
		}

		// Check if current user liked this post
		if currentUserID != nil {
			isLiked, err := s.postLikeRepo.IsPostLikedByUser(post.ID, *currentUserID)
			if err != nil {
				s.logger.Errorf("Failed to check if post is liked: %v", err)
			} else {
				response.IsLiked = isLiked
			}
		}

		postResponses[i] = response
	}

	totalPages := int(math.Ceil(float64(totalPosts) / float64(size)))

	return &models.PaginatedPostsResponse{
		Posts:      postResponses,
		Page:       page,
		Size:       size,
		TotalPosts: totalPosts,
		TotalPages: totalPages,
	}, nil
}

// GetPostByID retrieves a post by ID with author information
func (s *PostService) GetPostByID(id uuid.UUID, currentUserID *uuid.UUID) (*models.PostResponse, error) {
	post, err := s.postRepo.GetPostByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	if post == nil {
		return nil, nil
	}

	// Get author information
	author, err := s.userService.GetUserByID(post.AuthorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get author: %w", err)
	}

	response := &models.PostResponse{
		ID:           post.ID,
		AuthorID:     post.AuthorID,
		Content:      post.Content,
		EventID:      post.EventID,
		LikeCount:    post.LikeCount,
		CommentCount: post.CommentCount,
		CreatedAt:    post.CreatedAt,
		UpdatedAt:    post.UpdatedAt,
		Author:       author,
	}

	// Check if current user liked this post
	if currentUserID != nil {
		isLiked, err := s.postLikeRepo.IsPostLikedByUser(post.ID, *currentUserID)
		if err != nil {
			s.logger.Errorf("Failed to check if post is liked: %v", err)
		} else {
			response.IsLiked = isLiked
		}
	}

	return response, nil
}

// GetPostsByAuthor retrieves posts by author ID with pagination
func (s *PostService) GetPostsByAuthor(authorID uuid.UUID, page, size int, currentUserID *uuid.UUID) (*models.PaginatedPostsResponse, error) {
	posts, err := s.postRepo.GetPostsByAuthor(authorID, page, size)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts by author: %w", err)
	}

	totalPosts, err := s.postRepo.GetPostsCountByAuthor(authorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total posts count by author: %w", err)
	}

	// Get author information
	author, err := s.userService.GetUserByID(authorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get author: %w", err)
	}

	// Convert to response format
	postResponses := make([]models.PostResponse, len(posts))
	for i, post := range posts {
		response := models.PostResponse{
			ID:           post.ID,
			AuthorID:     post.AuthorID,
			Content:      post.Content,
			EventID:      post.EventID,
			LikeCount:    post.LikeCount,
			CommentCount: post.CommentCount,
			CreatedAt:    post.CreatedAt,
			UpdatedAt:    post.UpdatedAt,
			Author:       author,
		}

		// Check if current user liked this post
		if currentUserID != nil {
			isLiked, err := s.postLikeRepo.IsPostLikedByUser(post.ID, *currentUserID)
			if err != nil {
				s.logger.Errorf("Failed to check if post is liked: %v", err)
			} else {
				response.IsLiked = isLiked
			}
		}

		postResponses[i] = response
	}

	totalPages := int(math.Ceil(float64(totalPosts) / float64(size)))

	return &models.PaginatedPostsResponse{
		Posts:      postResponses,
		Page:       page,
		Size:       size,
		TotalPosts: totalPosts,
		TotalPages: totalPages,
	}, nil
}

// CreatePost creates a new post
func (s *PostService) CreatePost(authorID uuid.UUID, req *models.CreatePostRequest) (*models.PostResponse, error) {
	// Validate content length (following DATABASE&SCHEMAS.md constraint)
	if len(req.Content) > 280 {
		return nil, fmt.Errorf("content exceeds maximum length of 280 characters")
	}

	post := &models.Post{
		AuthorID:     authorID,
		Content:      req.Content,
		EventID:      req.EventID,
		LikeCount:    0,
		CommentCount: 0,
	}

	if err := s.postRepo.CreatePost(post); err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	// Get author information
	author, err := s.userService.GetUserByID(authorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get author: %w", err)
	}

	response := &models.PostResponse{
		ID:           post.ID,
		AuthorID:     post.AuthorID,
		Content:      post.Content,
		EventID:      post.EventID,
		LikeCount:    post.LikeCount,
		CommentCount: post.CommentCount,
		CreatedAt:    post.CreatedAt,
		UpdatedAt:    post.UpdatedAt,
		Author:       author,
		IsLiked:      false,
	}

	return response, nil
}

// DeletePost deletes a post (only by author)
func (s *PostService) DeletePost(id uuid.UUID, userID uuid.UUID) error {
	// First check if the post exists and get author info
	post, err := s.postRepo.GetPostByID(id)
	if err != nil {
		return fmt.Errorf("failed to get post: %w", err)
	}

	if post == nil {
		return fmt.Errorf("post not found")
	}

	// Check if user is the author
	if post.AuthorID != userID {
		return fmt.Errorf("unauthorized: only the author can delete this post")
	}

	if err := s.postRepo.DeletePost(id); err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	return nil
}

// LikePost adds a like to a post
func (s *PostService) LikePost(postID, userID uuid.UUID) error {
	// Check if post exists
	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return fmt.Errorf("failed to get post: %w", err)
	}

	if post == nil {
		return fmt.Errorf("post not found")
	}

	if err := s.postLikeRepo.LikePost(postID, userID); err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}

	return nil
}

// UnlikePost removes a like from a post
func (s *PostService) UnlikePost(postID, userID uuid.UUID) error {
	if err := s.postLikeRepo.UnlikePost(postID, userID); err != nil {
		return fmt.Errorf("failed to unlike post: %w", err)
	}

	return nil
}
