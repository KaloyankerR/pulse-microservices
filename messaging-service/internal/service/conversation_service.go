package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/pulse/messaging-service/internal/models"
	"github.com/pulse/messaging-service/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.uber.org/zap"
)

type ConversationService interface {
	CreateConversation(ctx context.Context, userID string, req *models.CreateConversationRequest) (*models.Conversation, error)
	CreateGroupConversation(ctx context.Context, userID string, req *models.CreateGroupRequest) (*models.Conversation, error)
	GetConversation(ctx context.Context, conversationID string) (*models.Conversation, error)
	GetUserConversations(ctx context.Context, userID string, limit, offset int) ([]*models.Conversation, error)
	GetOrCreateDirectConversation(ctx context.Context, user1, user2 string) (*models.Conversation, error)
	DeleteConversation(ctx context.Context, userID string, conversationID string) error
}

type conversationService struct {
	conversationRepo repository.ConversationRepository
	userClient       UserClient
	logger           *zap.Logger
}

func NewConversationService(
	conversationRepo repository.ConversationRepository,
	userClient UserClient,
	logger *zap.Logger,
) ConversationService {
	return &conversationService{
		conversationRepo: conversationRepo,
		userClient:       userClient,
		logger:           logger,
	}
}

// isUserServiceUnavailable checks if the error is due to user service being unavailable
func (s *conversationService) isUserServiceUnavailable(err error) bool {
	if err == nil {
		return false
	}
	errMsg := strings.ToLower(err.Error())
	return strings.Contains(errMsg, "user service unavailable") ||
		strings.Contains(errMsg, "connection refused") ||
		strings.Contains(errMsg, "connect: connection refused") ||
		strings.Contains(errMsg, "dial tcp") ||
		strings.Contains(errMsg, "no such host") ||
		strings.Contains(errMsg, "timeout") ||
		strings.Contains(errMsg, "econnrefused") ||
		strings.Contains(errMsg, "service unavailable") ||
		strings.Contains(errMsg, "failed to validate user")
}

func (s *conversationService) CreateConversation(ctx context.Context, userID string, req *models.CreateConversationRequest) (*models.Conversation, error) {
	// Validate userID
	if userID == "" {
		return nil, fmt.Errorf("user ID cannot be empty")
	}

	// Validate that the creator user exists (if user client is available)
	if s.userClient != nil {
		if err := s.userClient.ValidateUserExists(ctx, userID); err != nil {
			// Check if the error is due to user service being unavailable
			errMsg := strings.ToLower(err.Error())
			if s.isUserServiceUnavailable(err) || strings.Contains(errMsg, "dial tcp") || strings.Contains(errMsg, "connection refused") || strings.Contains(errMsg, "failed to validate user") {
				s.logger.Warn("User service unavailable for validation, continuing without validation",
					zap.String("user_id", userID),
					zap.String("error", err.Error()),
				)
				// Continue without validation when service is unavailable
			} else if strings.Contains(errMsg, "user not found") {
				// If user was actually not found, fail the request
				return nil, fmt.Errorf("creator user not found: %w", err)
			} else {
				// For other errors, also allow graceful degradation (but log it)
				s.logger.Warn("User validation error, continuing without validation",
					zap.String("user_id", userID),
					zap.String("error", err.Error()),
				)
			}
		}
	}

	// Add creator to participants if not already included
	participantSet := make(map[string]bool)
	for _, p := range req.Participants {
		if p == "" {
			return nil, fmt.Errorf("participant ID cannot be empty")
		}
		// Validate that each participant user exists (if user client is available)
		if s.userClient != nil {
			if err := s.userClient.ValidateUserExists(ctx, p); err != nil {
				// Check if the error is due to user service being unavailable
				errMsg := strings.ToLower(err.Error())
				if s.isUserServiceUnavailable(err) || strings.Contains(errMsg, "dial tcp") || strings.Contains(errMsg, "connection refused") || strings.Contains(errMsg, "failed to validate user") {
					s.logger.Warn("User service unavailable for validation, continuing without validation",
						zap.String("participant_id", p),
						zap.String("error", err.Error()),
					)
					// Continue without validation when service is unavailable
				} else if strings.Contains(errMsg, "user not found") {
					// If user was actually not found, fail the request
					return nil, fmt.Errorf("participant user not found: %s - %w", p, err)
				} else {
					// For other errors, also allow graceful degradation (but log it)
					s.logger.Warn("User validation error, continuing without validation",
						zap.String("participant_id", p),
						zap.String("error", err.Error()),
					)
				}
			}
		}
		participantSet[p] = true
	}
	participantSet[userID] = true

	participants := make([]string, 0, len(participantSet))
	for p := range participantSet {
		participants = append(participants, p)
	}

	// For direct conversations, ensure exactly 2 participants
	if req.Type == models.ConversationTypeDirect {
		if len(participants) != 2 {
			return nil, fmt.Errorf("direct conversations must have exactly 2 participants")
		}

		// Check if direct conversation already exists
		existing, err := s.conversationRepo.FindDirectConversation(ctx, participants[0], participants[1])
		if err != nil {
			return nil, err
		}
		if existing != nil {
			return existing, nil
		}
	}

	conversation := &models.Conversation{
		Type:         req.Type,
		Participants: participants,
		Name:         req.Name,
	}

	if err := s.conversationRepo.Create(ctx, conversation); err != nil {
		return nil, fmt.Errorf("failed to create conversation: %w", err)
	}

	s.logger.Info("Conversation created",
		zap.String("conversation_id", conversation.ID.Hex()),
		zap.String("type", string(conversation.Type)),
		zap.Int("participants", len(participants)),
	)

	return conversation, nil
}

func (s *conversationService) CreateGroupConversation(ctx context.Context, userID string, req *models.CreateGroupRequest) (*models.Conversation, error) {
	// Validate userID
	if userID == "" {
		return nil, fmt.Errorf("user ID cannot be empty")
	}

	// Validate that the creator user exists (if user client is available)
	if s.userClient != nil {
		if err := s.userClient.ValidateUserExists(ctx, userID); err != nil {
			// Check if the error is due to user service being unavailable
			errMsg := strings.ToLower(err.Error())
			if s.isUserServiceUnavailable(err) || strings.Contains(errMsg, "dial tcp") || strings.Contains(errMsg, "connection refused") || strings.Contains(errMsg, "failed to validate user") {
				s.logger.Warn("User service unavailable for validation, continuing without validation",
					zap.String("user_id", userID),
					zap.String("error", err.Error()),
				)
				// Continue without validation when service is unavailable
			} else if strings.Contains(errMsg, "user not found") {
				// If user was actually not found, fail the request
				return nil, fmt.Errorf("creator user not found: %w", err)
			} else {
				// For other errors, also allow graceful degradation (but log it)
				s.logger.Warn("User validation error, continuing without validation",
					zap.String("user_id", userID),
					zap.String("error", err.Error()),
				)
			}
		}
	}

	// Add creator to participants
	participantSet := make(map[string]bool)
	participantSet[userID] = true
	for _, p := range req.Participants {
		if p == "" {
			return nil, fmt.Errorf("participant ID cannot be empty")
		}
		// Validate that each participant user exists (if user client is available)
		if s.userClient != nil {
			if err := s.userClient.ValidateUserExists(ctx, p); err != nil {
				// Check if the error is due to user service being unavailable
				errMsg := strings.ToLower(err.Error())
				if s.isUserServiceUnavailable(err) || strings.Contains(errMsg, "dial tcp") || strings.Contains(errMsg, "connection refused") || strings.Contains(errMsg, "failed to validate user") {
					s.logger.Warn("User service unavailable for validation, continuing without validation",
						zap.String("participant_id", p),
						zap.String("error", err.Error()),
					)
					// Continue without validation when service is unavailable
				} else if strings.Contains(errMsg, "user not found") {
					// If user was actually not found, fail the request
					return nil, fmt.Errorf("participant user not found: %s - %w", p, err)
				} else {
					// For other errors, also allow graceful degradation (but log it)
					s.logger.Warn("User validation error, continuing without validation",
						zap.String("participant_id", p),
						zap.String("error", err.Error()),
					)
				}
			}
		}
		participantSet[p] = true
	}

	if len(participantSet) < 2 {
		return nil, fmt.Errorf("group conversations must have at least 2 participants")
	}

	participants := make([]string, 0, len(participantSet))
	for p := range participantSet {
		participants = append(participants, p)
	}

	conversation := &models.Conversation{
		Type:         models.ConversationTypeGroup,
		Participants: participants,
		Name:         req.Name,
	}

	if err := s.conversationRepo.Create(ctx, conversation); err != nil {
		return nil, fmt.Errorf("failed to create group conversation: %w", err)
	}

	s.logger.Info("Group conversation created",
		zap.String("conversation_id", conversation.ID.Hex()),
		zap.String("name", req.Name),
		zap.Int("participants", len(participants)),
	)

	return conversation, nil
}

func (s *conversationService) GetConversation(ctx context.Context, conversationID string) (*models.Conversation, error) {
	id, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		return nil, fmt.Errorf("invalid conversation ID: %w", err)
	}

	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	return conversation, nil
}

func (s *conversationService) GetUserConversations(ctx context.Context, userID string, limit, offset int) ([]*models.Conversation, error) {
	// Set default pagination
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	conversations, err := s.conversationRepo.GetByUserID(ctx, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch conversations: %w", err)
	}

	return conversations, nil
}

func (s *conversationService) GetOrCreateDirectConversation(ctx context.Context, user1, user2 string) (*models.Conversation, error) {
	// Check if conversation exists
	existing, err := s.conversationRepo.FindDirectConversation(ctx, user1, user2)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	// Create new direct conversation
	req := &models.CreateConversationRequest{
		Type:         models.ConversationTypeDirect,
		Participants: []string{user1, user2},
	}

	return s.CreateConversation(ctx, user1, req)
}

func (s *conversationService) DeleteConversation(ctx context.Context, userID string, conversationID string) error {
	// Parse conversation ID
	id, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		return fmt.Errorf("invalid conversation ID: %w", err)
	}

	// Get conversation to verify user is a participant
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant
	isParticipant := false
	for _, p := range conversation.Participants {
		if p == userID {
			isParticipant = true
			break
		}
	}
	if !isParticipant {
		return fmt.Errorf("user is not a participant in this conversation")
	}

	// Delete the conversation
	if err := s.conversationRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete conversation: %w", err)
	}

	s.logger.Info("Conversation deleted",
		zap.String("conversation_id", conversationID),
		zap.String("user_id", userID),
	)

	return nil
}
