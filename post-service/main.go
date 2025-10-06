package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/pulse/post-service-go/config"
	"github.com/pulse/post-service-go/handlers"
	"github.com/pulse/post-service-go/middleware"
	"github.com/pulse/post-service-go/repository"
	"github.com/pulse/post-service-go/service"
	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})

	// Initialize database
	db, err := config.InitDB()
	if err != nil {
		logger.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize repositories
	userCacheRepo := repository.NewUserCacheRepository(db, logger)
	postRepo := repository.NewPostRepository(db, logger)
	postLikeRepo := repository.NewPostLikeRepository(db, logger)

	// Initialize services
	userService := service.NewUserService(userCacheRepo, logger)
	postService := service.NewPostService(postRepo, postLikeRepo, userService, logger)

	// Initialize handlers
	authMiddleware := middleware.NewAuthMiddleware(logger)
	postHandler := handlers.NewPostHandler(postService, logger)

	// Setup routes
	router := mux.NewRouter()

	// Health check endpoint
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"UP","service":"post-service-go"}`))
	}).Methods("GET")

	// Metrics endpoint
	router.Handle("/metrics", promhttp.Handler()).Methods("GET")

	// API routes with authentication
	api := router.PathPrefix("/api/v1").Subrouter()

	// Post endpoints
	api.HandleFunc("/posts", postHandler.GetAllPosts).Methods("GET")
	api.HandleFunc("/posts", authMiddleware.RequireAuth(postHandler.CreatePost)).Methods("POST")
	api.HandleFunc("/posts/{id}", postHandler.GetPostByID).Methods("GET")
	api.HandleFunc("/posts/{id}", authMiddleware.RequireAuth(postHandler.DeletePost)).Methods("DELETE")
	api.HandleFunc("/posts/author/{authorId}", postHandler.GetPostsByAuthor).Methods("GET")
	api.HandleFunc("/posts/{id}/like", authMiddleware.RequireAuth(postHandler.LikePost)).Methods("POST")
	api.HandleFunc("/posts/{id}/like", authMiddleware.RequireAuth(postHandler.UnlikePost)).Methods("DELETE")

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization", "X-Auth-Token"},
		ExposedHeaders:   []string{"X-Auth-Token"},
		AllowCredentials: true,
		MaxAge:           3600,
	})

	handler := c.Handler(router)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	logger.Printf("Starting post-service-go on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
