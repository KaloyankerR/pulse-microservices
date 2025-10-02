package tests

import (
	"os"
	"testing"

	"github.com/pulse/messaging-service/internal/config"
	"github.com/stretchr/testify/assert"
)

func TestConfig_Load(t *testing.T) {
	// Set environment variables
	os.Setenv("PORT", "9999")
	os.Setenv("MONGODB_URL", "mongodb://testhost:27017")
	os.Setenv("JWT_SECRET", "test-secret")

	cfg := config.Load()

	assert.Equal(t, "9999", cfg.Port)
	assert.Equal(t, "mongodb://testhost:27017", cfg.MongoDBURL)
	assert.Equal(t, "test-secret", cfg.JWTSecret)

	// Clean up
	os.Unsetenv("PORT")
	os.Unsetenv("MONGODB_URL")
	os.Unsetenv("JWT_SECRET")
}

func TestConfig_Defaults(t *testing.T) {
	// Clear all environment variables
	os.Clearenv()

	cfg := config.Load()

	assert.Equal(t, "8084", cfg.Port)
	assert.Equal(t, "mongodb://localhost:27017", cfg.MongoDBURL)
	assert.Equal(t, "messaging_db", cfg.MongoDBName)
	assert.Equal(t, "redis://localhost:6379", cfg.RedisURL)
	assert.Equal(t, "development", cfg.Environment)
}
