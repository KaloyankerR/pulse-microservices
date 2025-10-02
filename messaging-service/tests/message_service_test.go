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

// Mock repositories
type MockMessageRepository struct {
	mock.Mock
}

func (m *MockMessageRepository) Create(ctx context.Context, message *models.Message) error {
	args := m.Called(ctx, message)
	message.ID = primitive.NewObjectID()
	message.CreatedAt = time.Now()
	return args.Error(0)
}

func (m *MockMessageRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Message, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Message), args.Error(1)
}

func (m *MockMessageRepository) GetByConversationID(ctx context.Context, conversationID primitive.ObjectID, limit, offset int) ([]*models.Message, error) {
	args := m.Called(ctx, conversationID, limit, offset)
	return args.Get(0).([]*models.Message), args.Error(1)
}

func (m *MockMessageRepository) MarkAsRead(ctx context.Context, messageID primitive.ObjectID, userID string) error {
	args := m.Called(ctx, messageID, userID)
	return args.Error(0)
}

func (m *MockMessageRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

type MockConversationRepository struct {
	mock.Mock
}

func (m *MockConversationRepository) Create(ctx context.Context, conversation *models.Conversation) error {
	args := m.Called(ctx, conversation)
	conversation.ID = primitive.NewObjectID()
	return args.Error(0)
}

func (m *MockConversationRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Conversation, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Conversation), args.Error(1)
}

func (m *MockConversationRepository) GetByUserID(ctx context.Context, userID string, limit, offset int) ([]*models.Conversation, error) {
	args := m.Called(ctx, userID, limit, offset)
	return args.Get(0).([]*models.Conversation), args.Error(1)
}

func (m *MockConversationRepository) FindDirectConversation(ctx context.Context, user1, user2 string) (*models.Conversation, error) {
	args := m.Called(ctx, user1, user2)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Conversation), args.Error(1)
}

func (m *MockConversationRepository) UpdateLastMessage(ctx context.Context, id primitive.ObjectID, lastMessage *models.LastMessage) error {
	args := m.Called(ctx, id, lastMessage)
	return args.Error(0)
}

func (m *MockConversationRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

type MockEventPublisher struct {
	mock.Mock
}

func (m *MockEventPublisher) PublishMessageSent(message *models.Message, participants []string) {
	m.Called(message, participants)
}

func (m *MockEventPublisher) PublishMessageRead(messageID, userID string) {
	m.Called(messageID, userID)
}

func TestMessageService_CreateMessage(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	mockMessageRepo := new(MockMessageRepository)
	mockConversationRepo := new(MockConversationRepository)

	messageService := service.NewMessageService(
		mockMessageRepo,
		mockConversationRepo,
		nil, // Event publisher not used in test
		logger,
	)

	ctx := context.Background()
	userID := "user123"
	convID := primitive.NewObjectID()

	// Mock conversation exists with user as participant
	conversation := &models.Conversation{
		ID:           convID,
		Type:         models.ConversationTypeDirect,
		Participants: []string{userID, "user456"},
	}

	req := &models.CreateMessageRequest{
		ConversationID: convID.Hex(),
		Content:        "Hello, World!",
		Mentions:       []string{},
	}

	mockConversationRepo.On("GetByID", ctx, convID).Return(conversation, nil)
	mockMessageRepo.On("Create", ctx, mock.AnythingOfType("*models.Message")).Return(nil)
	mockConversationRepo.On("UpdateLastMessage", ctx, convID, mock.AnythingOfType("*models.LastMessage")).Return(nil)

	message, err := messageService.CreateMessage(ctx, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, message)
	assert.Equal(t, userID, message.SenderID)
	assert.Equal(t, "Hello, World!", message.Content)
	assert.Equal(t, convID, message.ConversationID)
	mockMessageRepo.AssertExpectations(t)
	mockConversationRepo.AssertExpectations(t)
}

func TestMessageService_GetConversationMessages(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	mockMessageRepo := new(MockMessageRepository)
	mockConversationRepo := new(MockConversationRepository)

	messageService := service.NewMessageService(
		mockMessageRepo,
		mockConversationRepo,
		nil,
		logger,
	)

	ctx := context.Background()
	convID := primitive.NewObjectID()

	expectedMessages := []*models.Message{
		{
			ID:        primitive.NewObjectID(),
			SenderID:  "user123",
			Content:   "Message 1",
			CreatedAt: time.Now(),
		},
		{
			ID:        primitive.NewObjectID(),
			SenderID:  "user456",
			Content:   "Message 2",
			CreatedAt: time.Now(),
		},
	}

	mockMessageRepo.On("GetByConversationID", ctx, convID, 50, 0).Return(expectedMessages, nil)

	messages, err := messageService.GetConversationMessages(ctx, convID.Hex(), 50, 0)

	assert.NoError(t, err)
	assert.Len(t, messages, 2)
	assert.Equal(t, "Message 1", messages[0].Content)
	mockMessageRepo.AssertExpectations(t)
}

func TestMessageService_MarkMessageAsRead(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	mockMessageRepo := new(MockMessageRepository)

	messageService := service.NewMessageService(
		mockMessageRepo,
		nil,
		nil,
		logger,
	)

	ctx := context.Background()
	messageID := primitive.NewObjectID()
	userID := "user123"

	mockMessageRepo.On("MarkAsRead", ctx, messageID, userID).Return(nil)

	err := messageService.MarkMessageAsRead(ctx, messageID.Hex(), userID)

	assert.NoError(t, err)
	mockMessageRepo.AssertExpectations(t)
}
