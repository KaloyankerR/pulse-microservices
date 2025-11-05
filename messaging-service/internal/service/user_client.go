package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
)

type UserClient interface {
	ValidateUserExists(ctx context.Context, userID string) error
}

type userClient struct {
	baseURL    string
	httpClient *http.Client
	logger     *zap.Logger
}

type UserResponse struct {
	Success bool `json:"success"`
	Data    struct {
		User struct {
			ID string `json:"id"`
		} `json:"user"`
	} `json:"data"`
}

func NewUserClient(baseURL string, logger *zap.Logger) UserClient {
	return &userClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		logger: logger,
	}
}

func (c *userClient) ValidateUserExists(ctx context.Context, userID string) error {
	if userID == "" {
		return fmt.Errorf("user ID cannot be empty")
	}

	url := fmt.Sprintf("%s/api/v1/users/%s", c.baseURL, userID)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers for proper request
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.logger.Warn("Failed to validate user - connection error",
			zap.String("user_id", userID),
			zap.String("url", url),
			zap.Error(err),
		)
		// If we can't connect to user service, log but don't fail (graceful degradation)
		// This allows messaging to work even if user service is temporarily unavailable
		return fmt.Errorf("user service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("user not found: %s", userID)
	}

	if resp.StatusCode != http.StatusOK {
		// Try to read error message from response
		var errorResp struct {
			Success bool `json:"success"`
			Error   struct {
				Code    string `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&errorResp); err == nil && errorResp.Error.Message != "" {
			return fmt.Errorf("user service error: %s", errorResp.Error.Message)
		}
		return fmt.Errorf("user service returned status %d for user %s", resp.StatusCode, userID)
	}

	var userResp UserResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return fmt.Errorf("failed to decode user response: %w", err)
	}

	if !userResp.Success || userResp.Data.User.ID != userID {
		return fmt.Errorf("user validation failed for user %s", userID)
	}

	return nil
}

