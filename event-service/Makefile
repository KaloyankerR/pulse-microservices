.PHONY: help build build-no-cache test test-coverage lint format clean docker-build docker-build-no-cache sonar deps

SERVICE_NAME := event-service
DOCKER_IMAGE := $(SERVICE_NAME):latest
BIN_DIR := bin

help: ## Display available commands
	@echo "Available commands for $(SERVICE_NAME):"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the application
	@mkdir -p $(BIN_DIR)
	go build -o $(BIN_DIR)/$(SERVICE_NAME) ./main.go

build-no-cache: clean ## Clean build (no cache)
	go clean -cache -modcache -testcache
	@mkdir -p $(BIN_DIR)
	go build -o $(BIN_DIR)/$(SERVICE_NAME) ./main.go

test: ## Run tests
	go test ./... -v

test-coverage: ## Run tests with coverage
	go test ./... -v -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

lint: ## Run linter
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not installed. Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

format: ## Format code
	go fmt ./...

clean: ## Clean build artifacts
	rm -rf $(BIN_DIR)
	rm -f coverage.out coverage.html
	go clean

deps: ## Download dependencies
	go mod download
	go mod tidy

docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE) .

docker-build-no-cache: ## Build Docker image without cache
	docker build --no-cache -t $(DOCKER_IMAGE) .

sonar: test-coverage ## Run SonarQube analysis
	@if [ -z "$$SONAR_TOKEN" ]; then \
		echo "Error: SONAR_TOKEN environment variable is required"; \
		exit 1; \
	fi
	@if ! command -v sonar-scanner > /dev/null; then \
		echo "Error: sonar-scanner not found. Please install sonar-scanner."; \
		exit 1; \
	fi
	SONAR_TOKEN=$$SONAR_TOKEN sonar-scanner

.DEFAULT_GOAL := help

