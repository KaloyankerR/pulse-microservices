.PHONY: help build run test clean docker-build docker-run

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build the application
	go build -o bin/messaging-service ./cmd/main.go

run: ## Run the application
	go run cmd/main.go

test: ## Run tests
	go test ./... -v -coverprofile=coverage.out

test-coverage: test ## Run tests with coverage report
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

clean: ## Clean build artifacts
	rm -rf bin/
	rm -f coverage.out coverage.html

lint: ## Run linter
	golangci-lint run

fmt: ## Format code
	go fmt ./...

deps: ## Download dependencies
	go mod download
	go mod tidy

docker-build: ## Build Docker image
	docker build -t messaging-service:latest .

docker-run: ## Run Docker container
	docker run -p 8084:8084 --env-file .env messaging-service:latest

dev: ## Run in development mode with air (hot reload)
	air

.DEFAULT_GOAL := help

