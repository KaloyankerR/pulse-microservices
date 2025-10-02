package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/pulse/messaging-service/internal/handlers"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestHealthHandler_Health(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	logger, _ := zap.NewDevelopment()
	healthHandler := handlers.NewHealthHandler(nil, nil, logger)

	router.GET("/health", healthHandler.Health)

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "healthy")
	assert.Contains(t, w.Body.String(), "messaging-service")
}
