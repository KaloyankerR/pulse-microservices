package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/pulse/post-service-go/middleware"
	"github.com/pulse/post-service-go/models"
	"github.com/pulse/post-service-go/service"
	"github.com/sirupsen/logrus"
)

type PostHandler struct {
	postService *service.PostService
	logger      *logrus.Logger
}

func NewPostHandler(postService *service.PostService, logger *logrus.Logger) *PostHandler {
	return &PostHandler{
		postService: postService,
		logger:      logger,
	}
}

// GetAllPosts handles GET /api/v1/posts
func (h *PostHandler) GetAllPosts(w http.ResponseWriter, r *http.Request) {
	// Parse pagination parameters
	page, size, err := h.parsePaginationParams(r)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", err.Error())
		return
	}

	// Get current user ID from context (if authenticated)
	var currentUserID *uuid.UUID
	if userID, ok := middleware.GetUserIDFromContext(r.Context()); ok {
		currentUserID = &userID
	}

	// Get posts
	posts, err := h.postService.GetAllPosts(page, size, currentUserID)
	if err != nil {
		h.logger.Errorf("Failed to get posts: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve posts")
		return
	}

	h.writeJSONResponse(w, http.StatusOK, posts)
}

// GetPostByID handles GET /api/v1/posts/{id}
func (h *PostHandler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	// Parse post ID from URL
	vars := mux.Vars(r)
	postIDStr, ok := vars["id"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Post ID is required")
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid post ID format")
		return
	}

	// Get current user ID from context (if authenticated)
	var currentUserID *uuid.UUID
	if userID, ok := middleware.GetUserIDFromContext(r.Context()); ok {
		currentUserID = &userID
	}

	// Get post
	post, err := h.postService.GetPostByID(postID, currentUserID)
	if err != nil {
		h.logger.Errorf("Failed to get post: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve post")
		return
	}

	if post == nil {
		h.writeErrorResponse(w, http.StatusNotFound, "POST_NOT_FOUND", "Post not found")
		return
	}

	h.writeJSONResponse(w, http.StatusOK, post)
}

// GetPostsByAuthor handles GET /api/v1/posts/author/{authorId}
func (h *PostHandler) GetPostsByAuthor(w http.ResponseWriter, r *http.Request) {
	// Parse author ID from URL
	vars := mux.Vars(r)
	authorIDStr, ok := vars["authorId"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Author ID is required")
		return
	}

	authorID, err := uuid.Parse(authorIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid author ID format")
		return
	}

	// Parse pagination parameters
	page, size, err := h.parsePaginationParams(r)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", err.Error())
		return
	}

	// Get current user ID from context (if authenticated)
	var currentUserID *uuid.UUID
	if userID, ok := middleware.GetUserIDFromContext(r.Context()); ok {
		currentUserID = &userID
	}

	// Get posts by author
	posts, err := h.postService.GetPostsByAuthor(authorID, page, size, currentUserID)
	if err != nil {
		h.logger.Errorf("Failed to get posts by author: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve posts")
		return
	}

	h.writeJSONResponse(w, http.StatusOK, posts)
}

// CreatePost handles POST /api/v1/posts
func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (required for authenticated endpoints)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	// Get user claims from context to sync user info
	userClaims, ok := middleware.GetUserClaimsFromContext(r.Context())
	if !ok {
		h.logger.Warn("User claims not found in context")
	}

	// Parse request body
	var req models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	// Validate request
	if req.Content == "" {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "Content is required")
		return
	}

	if len(req.Content) > 280 {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "Content exceeds maximum length of 280 characters")
		return
	}

	// Create post with user claims for caching
	post, err := h.postService.CreatePostWithUserInfo(userID, &req, userClaims)
	if err != nil {
		h.logger.Errorf("Failed to create post: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create post")
		return
	}

	h.writeJSONResponse(w, http.StatusCreated, post)
}

// DeletePost handles DELETE /api/v1/posts/{id}
func (h *PostHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (required for authenticated endpoints)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	// Parse post ID from URL
	vars := mux.Vars(r)
	postIDStr, ok := vars["id"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Post ID is required")
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid post ID format")
		return
	}

	// Delete post
	if err := h.postService.DeletePost(postID, userID); err != nil {
		if err.Error() == "post not found" {
			h.writeErrorResponse(w, http.StatusNotFound, "POST_NOT_FOUND", "Post not found")
			return
		}
		if err.Error() == "unauthorized: only the author can delete this post" {
			h.writeErrorResponse(w, http.StatusForbidden, "FORBIDDEN", "Only the author can delete this post")
			return
		}
		h.logger.Errorf("Failed to delete post: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete post")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// LikePost handles POST /api/v1/posts/{id}/like
func (h *PostHandler) LikePost(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (required for authenticated endpoints)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	// Parse post ID from URL
	vars := mux.Vars(r)
	postIDStr, ok := vars["id"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Post ID is required")
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid post ID format")
		return
	}

	// Like post
	if err := h.postService.LikePost(postID, userID); err != nil {
		if err.Error() == "post not found" {
			h.writeErrorResponse(w, http.StatusNotFound, "POST_NOT_FOUND", "Post not found")
			return
		}
		h.logger.Errorf("Failed to like post: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to like post")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UnlikePost handles DELETE /api/v1/posts/{id}/like
func (h *PostHandler) UnlikePost(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (required for authenticated endpoints)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	// Parse post ID from URL
	vars := mux.Vars(r)
	postIDStr, ok := vars["id"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Post ID is required")
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid post ID format")
		return
	}

	// Unlike post
	if err := h.postService.UnlikePost(postID, userID); err != nil {
		if err.Error() == "like not found" {
			h.writeErrorResponse(w, http.StatusNotFound, "LIKE_NOT_FOUND", "Like not found")
			return
		}
		h.logger.Errorf("Failed to unlike post: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to unlike post")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper functions

func (h *PostHandler) parsePaginationParams(r *http.Request) (int, int, error) {
	pageStr := r.URL.Query().Get("page")
	sizeStr := r.URL.Query().Get("size")

	page := 0
	size := 10 // Default size

	if pageStr != "" {
		var err error
		page, err = strconv.Atoi(pageStr)
		if err != nil || page < 0 {
			return 0, 0, err
		}
	}

	if sizeStr != "" {
		var err error
		size, err = strconv.Atoi(sizeStr)
		if err != nil || size < 1 || size > 100 {
			return 0, 0, err
		}
	}

	return page, size, nil
}

func (h *PostHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func (h *PostHandler) writeErrorResponse(w http.ResponseWriter, statusCode int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	errorResponse := map[string]interface{}{
		"success": false,
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
		},
	}

	json.NewEncoder(w).Encode(errorResponse)
}
