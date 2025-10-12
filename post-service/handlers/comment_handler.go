package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/pulse/post-service-go/middleware"
	"github.com/pulse/post-service-go/models"
	"github.com/pulse/post-service-go/service"
	"github.com/sirupsen/logrus"
)

type CommentHandler struct {
	commentService *service.CommentService
	logger         *logrus.Logger
}

func NewCommentHandler(commentService *service.CommentService, logger *logrus.Logger) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
		logger:         logger,
	}
}

// CreateComment handles POST /api/v1/posts/{postId}/comments
func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (required for authentication)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	// Parse post ID from URL
	vars := mux.Vars(r)
	postIDStr, ok := vars["postId"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Post ID is required")
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid post ID format")
		return
	}

	// Parse request body
	var req models.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	// Create comment
	comment, err := h.commentService.CreateComment(r.Context(), postID, userID, &req)
	if err != nil {
		h.logger.Errorf("Failed to create comment: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create comment")
		return
	}

	h.writeJSONResponse(w, http.StatusCreated, comment)
}

// GetCommentsByPostID handles GET /api/v1/posts/{postId}/comments
func (h *CommentHandler) GetCommentsByPostID(w http.ResponseWriter, r *http.Request) {
	// Parse post ID from URL
	vars := mux.Vars(r)
	postIDStr, ok := vars["postId"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Post ID is required")
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid post ID format")
		return
	}

	// Get comments
	comments, err := h.commentService.GetCommentsByPostID(r.Context(), postID)
	if err != nil {
		h.logger.Errorf("Failed to get comments: %v", err)
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve comments")
		return
	}

	h.writeJSONResponse(w, http.StatusOK, comments)
}

// DeleteComment handles DELETE /api/v1/posts/{postId}/comments/{commentId}
func (h *CommentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (required for authentication)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	// Parse comment ID from URL
	vars := mux.Vars(r)
	commentIDStr, ok := vars["commentId"]
	if !ok {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Comment ID is required")
		return
	}

	commentID, err := uuid.Parse(commentIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "INVALID_PARAMETERS", "Invalid comment ID format")
		return
	}

	// Delete comment
	if err := h.commentService.DeleteComment(r.Context(), commentID, userID); err != nil {
		h.logger.Errorf("Failed to delete comment: %v", err)
		if err.Error() == "comment not found" {
			h.writeErrorResponse(w, http.StatusNotFound, "COMMENT_NOT_FOUND", "Comment not found")
			return
		}
		if err.Error() == "unauthorized to delete this comment" {
			h.writeErrorResponse(w, http.StatusForbidden, "FORBIDDEN", "Unauthorized to delete this comment")
			return
		}
		h.writeErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete comment")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper methods
func (h *CommentHandler) writeJSONResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *CommentHandler) writeErrorResponse(w http.ResponseWriter, status int, code string, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	})
}
