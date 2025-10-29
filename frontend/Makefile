.PHONY: help build build-no-cache test test-coverage lint format clean docker-build docker-build-no-cache sonar

SERVICE_NAME := frontend
DOCKER_IMAGE := $(SERVICE_NAME):latest

help: ## Display available commands
	@echo "Available commands for $(SERVICE_NAME):"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the service
	npm ci
	npm run build

build-no-cache: clean ## Clean build (no cache)
	rm -rf node_modules .next
	npm ci
	npm run build

test: ## Run tests (placeholder - add if tests exist)
	@echo "No tests configured for frontend yet"

test-coverage: ## Run tests with coverage (placeholder)
	@echo "No tests configured for frontend yet"

lint: ## Run linter (placeholder)
	@echo "No linter configured for frontend yet"

format: ## Format code (placeholder)
	@echo "No formatter configured for frontend yet"

clean: ## Clean build artifacts
	rm -rf node_modules/.cache
	rm -rf .next
	rm -rf .turbo
	find . -type d -name "node_modules" -prune -o -type f -name "*.log" -delete

docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE) .

docker-build-no-cache: ## Build Docker image without cache
	docker build --no-cache -t $(DOCKER_IMAGE) .

sonar: ## Run SonarQube analysis (placeholder)
	@echo "SonarQube not configured for frontend yet"

.DEFAULT_GOAL := help

