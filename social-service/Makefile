.PHONY: help build build-no-cache test test-coverage lint format clean docker-build docker-build-no-cache sonar

SERVICE_NAME := social-service
DOCKER_IMAGE := $(SERVICE_NAME):latest

help: ## Display available commands
	@echo "Available commands for $(SERVICE_NAME):"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the service
	npm ci
	npm run build

build-no-cache: clean ## Clean build (no cache)
	rm -rf node_modules dist
	npm ci
	npm run build

test: ## Run tests
	npm test

test-coverage: ## Run tests with coverage
	npm run test:coverage

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

clean: ## Clean build artifacts
	rm -rf node_modules/.cache
	rm -rf dist
	rm -rf coverage
	find . -type d -name "node_modules" -prune -o -type f -name "*.log" -delete

docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE) .

docker-build-no-cache: ## Build Docker image without cache
	docker build --no-cache -t $(DOCKER_IMAGE) .

sonar: test-coverage ## Run SonarQube analysis
	@if [ -z "$$SONAR_TOKEN" ]; then \
		echo "Error: SONAR_TOKEN environment variable is required"; \
		exit 1; \
	fi
	SONAR_TOKEN=$$SONAR_TOKEN npm run sonar

.DEFAULT_GOAL := help

