package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/pulse/post-service-go/models"
	"github.com/sirupsen/logrus"
)

type AuthMiddleware struct {
	logger *logrus.Logger
}

func NewAuthMiddleware(logger *logrus.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		logger: logger,
	}
}

func (a *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get JWT secret from environment
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "dev-secret-key-change-in-production" // Default for development
		}

		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			a.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authorization header is required")
			return
		}

		// Extract token from "Bearer <token>" format
		tokenString := ""
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = authHeader[7:]
		} else {
			a.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header format")
			return
		}

		// Parse and validate JWT token
		token, err := jwt.ParseWithClaims(tokenString, &models.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			a.logger.Errorf("JWT validation error: %v", err)
			a.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token")
			return
		}

		// Extract claims
		claims, ok := token.Claims.(*models.JWTClaims)
		if !ok || !token.Valid {
			a.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid token claims")
			return
		}

		// Parse user ID from claims
		userIDStr := claims.UserID
		if userIDStr == "" {
			userIDStr = claims.ID // Fallback to ID field
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			a.logger.Errorf("Invalid user ID in token: %v", err)
			a.writeErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid user ID in token")
			return
		}

		// Add user information to request context
		ctx := r.Context()
		ctx = contextWithUserID(ctx, userID)
		ctx = contextWithUserClaims(ctx, claims)
		r = r.WithContext(ctx)

		// Call next handler
		next.ServeHTTP(w, r)
	}
}

// writeErrorResponse writes a standardized error response
func (a *AuthMiddleware) writeErrorResponse(w http.ResponseWriter, statusCode int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	errorResponse := map[string]interface{}{
		"success": false,
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
		},
	}

	json.NewEncoder(w).Encode(errorResponse)
}

// Context key types for type safety
type contextKey string

const (
	userIDKey     contextKey = "userID"
	userClaimsKey contextKey = "userClaims"
)

// Context helper functions
func contextWithUserID(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func contextWithUserClaims(ctx context.Context, claims *models.JWTClaims) context.Context {
	return context.WithValue(ctx, userClaimsKey, claims)
}

func GetUserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(userIDKey).(uuid.UUID)
	return userID, ok
}

func GetUserClaimsFromContext(ctx context.Context) (*models.JWTClaims, bool) {
	claims, ok := ctx.Value(userClaimsKey).(*models.JWTClaims)
	return claims, ok
}
