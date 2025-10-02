package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port        string
	MongoDBURL  string
	MongoDBName string
	RedisURL    string
	RabbitMQURL string
	JWTSecret   string
	Environment string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8084"),
		MongoDBURL:  getEnv("MONGODB_URL", "mongodb://localhost:27017"),
		MongoDBName: getEnv("MONGODB_NAME", "messaging_db"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		RabbitMQURL: getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		Environment: getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
