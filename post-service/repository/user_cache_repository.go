package repository

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/pulse/post-service-go/models"
	"github.com/sirupsen/logrus"
)

type UserCacheRepository struct {
	db     *sql.DB
	logger *logrus.Logger
}

func NewUserCacheRepository(db *sql.DB, logger *logrus.Logger) *UserCacheRepository {
	return &UserCacheRepository{
		db:     db,
		logger: logger,
	}
}

// GetUserByID retrieves a user from cache by ID
func (r *UserCacheRepository) GetUserByID(id uuid.UUID) (*models.UserCache, error) {
	query := `
		SELECT id, username, display_name, avatar_url, verified, last_synced, updated_at
		FROM user_cache
		WHERE id = $1
	`

	var user models.UserCache
	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Username, &user.DisplayName, &user.AvatarURL,
		&user.Verified, &user.LastSynced, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query user cache: %w", err)
	}

	return &user, nil
}

// GetUsersByIDs retrieves multiple users from cache by IDs
func (r *UserCacheRepository) GetUsersByIDs(ids []uuid.UUID) (map[uuid.UUID]*models.UserCache, error) {
	if len(ids) == 0 {
		return make(map[uuid.UUID]*models.UserCache), nil
	}

	// Build query with IN clause for better compatibility
	query := `
		SELECT id, username, display_name, avatar_url, verified, last_synced, updated_at
		FROM user_cache
		WHERE id = ANY($1)
	`

	// Convert UUIDs to proper PostgreSQL array format
	rows, err := r.db.Query(query, pq.Array(ids))
	if err != nil {
		return nil, fmt.Errorf("failed to query user cache by IDs: %w", err)
	}
	defer rows.Close()

	users := make(map[uuid.UUID]*models.UserCache)
	for rows.Next() {
		var user models.UserCache
		err := rows.Scan(
			&user.ID, &user.Username, &user.DisplayName, &user.AvatarURL,
			&user.Verified, &user.LastSynced, &user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user cache: %w", err)
		}
		users[user.ID] = &user
	}

	return users, nil
}

// CreateOrUpdateUser creates or updates a user in cache
func (r *UserCacheRepository) CreateOrUpdateUser(user *models.UserCache) error {
	query := `
		INSERT INTO user_cache (id, username, display_name, avatar_url, verified, last_synced, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			username = EXCLUDED.username,
			display_name = EXCLUDED.display_name,
			avatar_url = EXCLUDED.avatar_url,
			verified = EXCLUDED.verified,
			updated_at = NOW()
	`

	_, err := r.db.Exec(query,
		user.ID, user.Username, user.DisplayName, user.AvatarURL, user.Verified,
	)

	if err != nil {
		return fmt.Errorf("failed to create or update user cache: %w", err)
	}

	return nil
}

// DeleteUser removes a user from cache
func (r *UserCacheRepository) DeleteUser(id uuid.UUID) error {
	query := `DELETE FROM user_cache WHERE id = $1`

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user cache: %w", err)
	}

	return nil
}
