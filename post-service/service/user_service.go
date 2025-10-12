package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pulse/post-service-go/models"
	"github.com/pulse/post-service-go/repository"
	"github.com/sirupsen/logrus"
)

type UserService struct {
	userCacheRepo *repository.UserCacheRepository
	logger        *logrus.Logger
}

func NewUserService(userCacheRepo *repository.UserCacheRepository, logger *logrus.Logger) *UserService {
	return &UserService{
		userCacheRepo: userCacheRepo,
		logger:        logger,
	}
}

// GetUserByID retrieves a user from cache
func (s *UserService) GetUserByID(id uuid.UUID) (*models.UserCache, error) {
	user, err := s.userCacheRepo.GetUserByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// If user not found in cache, create a minimal user record
	if user == nil {
		s.logger.Warnf("User %s not found in cache, creating minimal record", id.String())

		// Create a minimal user cache entry
		minimalUser := &models.UserCache{
			ID:         id,
			Username:   "unknown_user",
			Verified:   false,
			LastSynced: time.Now(),
			UpdatedAt:  time.Now(),
		}

		// Save to cache for future requests
		if err := s.userCacheRepo.CreateOrUpdateUser(minimalUser); err != nil {
			s.logger.Errorf("Failed to create minimal user cache: %v", err)
		}

		return minimalUser, nil
	}

	return user, nil
}

// GetUsersByIDs retrieves multiple users from cache
func (s *UserService) GetUsersByIDs(ids []uuid.UUID) (map[uuid.UUID]*models.UserCache, error) {
	users, err := s.userCacheRepo.GetUsersByIDs(ids)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	// For any missing users, create minimal records
	for _, id := range ids {
		if _, exists := users[id]; !exists {
			s.logger.Warnf("User %s not found in cache, creating minimal record", id.String())

			minimalUser := &models.UserCache{
				ID:         id,
				Username:   "unknown_user",
				Verified:   false,
				LastSynced: time.Now(),
				UpdatedAt:  time.Now(),
			}

			if err := s.userCacheRepo.CreateOrUpdateUser(minimalUser); err != nil {
				s.logger.Errorf("Failed to create minimal user cache: %v", err)
			}

			users[id] = minimalUser
		}
	}

	return users, nil
}

// SyncUserFromUserService would typically fetch user data from user-service
// For now, we'll implement a placeholder that could be enhanced with HTTP calls
func (s *UserService) SyncUserFromUserService(userID uuid.UUID) (*models.UserCache, error) {
	// TODO: Implement HTTP call to user-service to get fresh user data
	// This would be used to refresh stale cache entries

	s.logger.Infof("Sync requested for user %s (not implemented yet)", userID.String())

	// For now, just return the cached user or create minimal one
	return s.GetUserByID(userID)
}

// SyncUserFromClaims syncs user information from JWT claims to cache
func (s *UserService) SyncUserFromClaims(user *models.UserCache) error {
	// Update last_synced and updated_at fields
	user.LastSynced = time.Now()
	user.UpdatedAt = time.Now()

	// Create or update user in cache
	if err := s.userCacheRepo.CreateOrUpdateUser(user); err != nil {
		return fmt.Errorf("failed to sync user from claims: %w", err)
	}

	s.logger.Infof("Synced user %s (%s) from JWT claims", user.ID.String(), user.Username)
	return nil
}
