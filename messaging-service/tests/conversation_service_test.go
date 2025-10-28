package tests

import (
	"context"
	"testing"
	"time"

	"github.com/pulse/messaging-service/internal/models"
	"github.com/pulse/messaging-service/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.uber.org/zap"
)

func TestConversationService_CreateConversation(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	mockConversationRepo := new(MockConversationRepository)

	conversationService := service.NewConversationService(mockConversationRepo, logger)

	ctx := context.Background()
	userID := "user123"

	req := &models.CreateConversationRequest{
		Type:         models.ConversationTypeDirect,
		Participants: []string{"user456"},
		Name:         "",
	}

	// Mock that no existing conversation exists (order might vary due to map iteration)
	mockConversationRepo.On("FindDirectConversation", ctx, mock.Anything, mock.Anything).Return(nil, nil)
	mockConversationRepo.On("Create", ctx, mock.AnythingOfType("*models.Conversation")).Return(nil)

	conversation, err := conversationService.CreateConversation(ctx, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, conversation)
	assert.Equal(t, models.ConversationTypeDirect, conversation.Type)
	assert.Len(t, conversation.Participants, 2)
	assert.Contains(t, conversation.Participants, userID)
	assert.Contains(t, conversation.Participants, "user456")
	mockConversationRepo.AssertExpectations(t)
}

func TestConversationService_CreateGroupConversation(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	mockConversationRepo := new(MockConversationRepository)

	conversationService := service.NewConversationService(mockConversationRepo, logger)

	ctx := context.Background()
	userID := "user123"

	req := &models.CreateGroupRequest{
		Name:         "Test Group",
		Participants: []string{"user456", "user789"},
	}

	mockConversationRepo.On("Create", ctx, mock.AnythingOfType("*models.Conversation")).Return(nil)

	conversation, err := conversationService.CreateGroupConversation(ctx, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, conversation)
	assert.Equal(t, models.ConversationTypeGroup, conversation.Type)
	assert.Equal(t, "Test Group", conversation.Name)
	assert.Len(t, conversation.Participants, 3)
	assert.Contains(t, conversation.Participants, userID)
	mockConversationRepo.AssertExpectations(t)
}

func TestConversationService_GetUserConversations(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	mockConversationRepo := new(MockConversationRepository)

	conversationService := service.NewConversationService(mockConversationRepo, logger)

	ctx := context.Background()
	userID := "user123"

	expectedConversations := []*models.Conversation{
		{
			ID:           primitive.NewObjectID(),
			Type:         models.ConversationTypeDirect,
			Participants: []string{userID, "user456"},
			CreatedAt:    time.Now(),
		},
		{
			ID:           primitive.NewObjectID(),
			Type:         models.ConversationTypeGroup,
			Participants: []string{userID, "user456", "user789"},
			Name:         "Test Group",
			CreatedAt:    time.Now(),
		},
	}

	mockConversationRepo.On("GetByUserID", ctx, userID, 50, 0).Return(expectedConversations, nil)

	conversations, err := conversationService.GetUserConversations(ctx, userID, 50, 0)

	assert.NoError(t, err)
	assert.Len(t, conversations, 2)
	assert.Equal(t, models.ConversationTypeDirect, conversations[0].Type)
	assert.Equal(t, models.ConversationTypeGroup, conversations[1].Type)
	mockConversationRepo.AssertExpectations(t)
}

func TestConversationService_GetOrCreateDirectConversation(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	mockConversationRepo := new(MockConversationRepository)

	conversationService := service.NewConversationService(mockConversationRepo, logger)

	ctx := context.Background()
	user1 := "user123"
	user2 := "user456"

	// Test when conversation doesn't exist
	// Note: FindDirectConversation may be called twice - once from GetOrCreateDirectConversation
	// and once from CreateConversation. Due to map iteration order, the second call might have
	// reversed user IDs. We use mock.Anything to accept either order.
	mockConversationRepo.On("FindDirectConversation", ctx, mock.Anything, mock.Anything).Return(nil, nil)
	mockConversationRepo.On("Create", ctx, mock.AnythingOfType("*models.Conversation")).Return(nil)

	conversation, err := conversationService.GetOrCreateDirectConversation(ctx, user1, user2)

	assert.NoError(t, err)
	assert.NotNil(t, conversation)
	assert.Equal(t, models.ConversationTypeDirect, conversation.Type)
	mockConversationRepo.AssertExpectations(t)

	// Test when conversation exists
	mockConversationRepo2 := new(MockConversationRepository)
	conversationService2 := service.NewConversationService(mockConversationRepo2, logger)

	existingConv := &models.Conversation{
		ID:           primitive.NewObjectID(),
		Type:         models.ConversationTypeDirect,
		Participants: []string{user1, user2},
	}

	// First call will find the existing conversation, so return it
	mockConversationRepo2.On("FindDirectConversation", ctx, mock.Anything, mock.Anything).Return(existingConv, nil).Once()

	conversation2, err2 := conversationService2.GetOrCreateDirectConversation(ctx, user1, user2)

	assert.NoError(t, err2)
	assert.NotNil(t, conversation2)
	assert.Equal(t, existingConv.ID, conversation2.ID)
	mockConversationRepo2.AssertExpectations(t)
}
