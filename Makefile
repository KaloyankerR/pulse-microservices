.PHONY: help up down logs ps restart rebuild rebuild-no-cache rebuild-frontend clean test db-reset db-setup db-drop-all db-build-all db-reset-all dev dev-stop \
	build-all build-all-no-cache test-all test-coverage-all lint-all format-all clean-all docker-build-all docker-build-all-no-cache sonar-all \
	logs-% restart-% health-check-% health-check

# Define all microservices
SERVICES := user-service notification-service social-service post-service messaging-service event-service frontend

# Service health check endpoints (using direct service ports)
HEALTH_ENDPOINTS := \
	user-service=http://localhost:8081/health \
	post-service=http://localhost:8082/health \
	social-service=http://localhost:8085/health \
	messaging-service=http://localhost:8084/health \
	notification-service=http://localhost:8086/health \
	event-service=http://localhost:8083/health \
	frontend=http://localhost:3000/api/health

help: ## Show this help message
	@echo ""
	@echo "\033[1mPulse Microservices - Root Makefile\033[0m"
	@echo ""
	@echo "\033[1mDocker Compose Operations:\033[0m"
	@grep -E '^(up|down|logs|ps|restart|rebuild|dev|clean):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@grep -E '^rebuild-.*:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mService Orchestration:\033[0m"
	@grep -E '^(build-all|test-all|lint-all|format-all|clean-all|docker-build-all|sonar-all|test-coverage-all|build-all-no-cache|docker-build-all-no-cache):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mHealth Checks:\033[0m"
	@grep -E '^(health-check|test):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mDatabase Operations:\033[0m"
	@grep -E '^db-[a-z-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mService-Specific Commands:\033[0m"
	@grep -E '^(logs-%|restart-%|health-check-%):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mUsage:\033[0m"
	@echo "  For service-specific commands, navigate to the service directory and run: make help"
	@echo ""

# =============================================================================
# Docker Compose Operations
# =============================================================================

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-%: ## View logs for a specific service (e.g., logs-user-service)
	@service=$$(echo $* | sed 's/-/_/g'); \
	docker-compose logs -f $$service || docker-compose logs -f $*

ps: ## List running services
	docker-compose ps

restart: ## Restart all services
	docker-compose restart

restart-%: ## Restart a specific service (e.g., restart-user-service)
	@service=$$(echo $* | sed 's/-/_/g'); \
	docker-compose restart $$service || docker-compose restart $*

rebuild: ## Rebuild and restart all services
	docker-compose up -d --build

rebuild-no-cache: ## Force rebuild all services without cache
	docker-compose build --no-cache
	docker-compose up -d

rebuild-frontend: ## Rebuild only frontend
	docker-compose build --no-cache frontend
	docker-compose up -d frontend

dev: ## Start development environment with hot reload
	docker-compose --profile dev up -d frontend-dev

dev-stop: ## Stop development environment
	docker-compose --profile dev down frontend-dev

clean: ## Stop services and remove volumes
	docker-compose down -v

# =============================================================================
# Service Orchestration Commands
# =============================================================================

build-all: ## Build all services locally
	@echo "Building all services..."
	@for service in $(SERVICES); do \
		echo "Building $$service..."; \
		cd $$service && $(MAKE) build && cd .. || echo "⚠️  Build failed for $$service"; \
	done
	@echo "✅ All services built!"

build-all-no-cache: ## Clean build all services
	@echo "Building all services without cache..."
	@for service in $(SERVICES); do \
		echo "Building $$service without cache..."; \
		cd $$service && $(MAKE) build-no-cache && cd .. || echo "⚠️  Build failed for $$service"; \
	done
	@echo "✅ All services built without cache!"

test-all: ## Run tests for all services
	@echo "Running tests for all services..."
	@for service in $(SERVICES); do \
		echo "Testing $$service..."; \
		cd $$service && $(MAKE) test && cd .. || echo "⚠️  Tests failed for $$service"; \
	done
	@echo "✅ All tests completed!"

test-coverage-all: ## Run tests with coverage for all services
	@echo "Running tests with coverage for all services..."
	@for service in $(SERVICES); do \
		echo "Running coverage tests for $$service..."; \
		cd $$service && $(MAKE) test-coverage && cd .. || echo "⚠️  Coverage tests failed for $$service"; \
	done
	@echo "✅ All coverage reports generated!"

lint-all: ## Lint all services
	@echo "Linting all services..."
	@for service in $(SERVICES); do \
		echo "Linting $$service..."; \
		cd $$service && $(MAKE) lint && cd .. || echo "⚠️  Linting failed for $$service"; \
	done
	@echo "✅ All services linted!"

format-all: ## Format all services
	@echo "Formatting all services..."
	@for service in $(SERVICES); do \
		echo "Formatting $$service..."; \
		cd $$service && $(MAKE) format && cd .. || echo "⚠️  Formatting failed for $$service"; \
	done
	@echo "✅ All services formatted!"

clean-all: ## Clean all services
	@echo "Cleaning all services..."
	@for service in $(SERVICES); do \
		echo "Cleaning $$service..."; \
		cd $$service && $(MAKE) clean && cd .. || echo "⚠️  Clean failed for $$service"; \
	done
	@echo "✅ All services cleaned!"

docker-build-all: ## Build Docker images for all services
	@echo "Building Docker images for all services..."
	@for service in $(SERVICES); do \
		echo "Building Docker image for $$service..."; \
		cd $$service && $(MAKE) docker-build && cd .. || echo "⚠️  Docker build failed for $$service"; \
	done
	@echo "✅ All Docker images built!"

docker-build-all-no-cache: ## Build Docker images without cache for all services
	@echo "Building Docker images without cache for all services..."
	@for service in $(SERVICES); do \
		echo "Building Docker image without cache for $$service..."; \
		cd $$service && $(MAKE) docker-build-no-cache && cd .. || echo "⚠️  Docker build failed for $$service"; \
	done
	@echo "✅ All Docker images built without cache!"

# =============================================================================
# Health Checks
# =============================================================================

health-check: ## Check health of all services
	@echo "🏥 Checking health of all services..."
	@for endpoint in $(HEALTH_ENDPOINTS); do \
		service=$$(echo $$endpoint | cut -d'=' -f1); \
		url=$$(echo $$endpoint | cut -d'=' -f2); \
		echo -n "Checking $$service... "; \
		if curl -sf $$url > /dev/null 2>&1; then \
			echo "✅ healthy"; \
		else \
			echo "❌ unhealthy"; \
		fi; \
	done

health-check-%: ## Check health of a specific service (e.g., health-check-user-service)
	@service=$*; \
	endpoint=$$(echo "$(HEALTH_ENDPOINTS)" | grep -o "$$service=[^ ]*"); \
	if [ -z "$$endpoint" ]; then \
		echo "❌ No health endpoint configured for $$service"; \
		exit 1; \
	fi; \
	url=$$(echo $$endpoint | cut -d'=' -f2); \
	echo "🏥 Checking health of $$service at $$url..."; \
	if curl -sf $$url > /dev/null 2>&1; then \
		echo "✅ $$service is healthy"; \
	else \
		echo "❌ $$service is unhealthy"; \
		exit 1; \
	fi

# Legacy test command (redirects to health-check for backward compatibility)
test: health-check ## Run basic health checks (alias for health-check)

# =============================================================================
# SonarQube Analysis Commands
# =============================================================================

sonar-all: ## Run SonarQube analysis for all services
	@echo "🔍 Running SonarQube analysis for all services..."
	@for service in $(SERVICES); do \
		echo "Analyzing $$service..."; \
		cd $$service && $(MAKE) sonar && cd .. || echo "⚠️  SonarQube analysis failed for $$service"; \
	done
	@echo "✅ All SonarQube analyses complete! View results at http://localhost:9001"

# =============================================================================
# Load Testing (k6)
# =============================================================================

load-test-create-user: ## Create test user for load testing
	@echo "👤 Creating test user for load testing..."
	@cd load-tests && ./scripts/create-test-user.sh

load-test-baseline: load-test-create-user ## Run baseline load tests (normal load)
	@echo "🚀 Running baseline load tests..."
	@mkdir -p load-tests/results
	@k6 run --out json=load-tests/results/baseline-summary.json --out csv=load-tests/results/baseline-metrics.csv load-tests/scenarios/baseline/baseline.js
	@echo "✅ Baseline load tests complete! Check results in load-tests/results/"

load-test-stress: ## Run stress load tests (find breaking point)
	@echo "🚀 Running stress load tests..."
	@mkdir -p load-tests/results
	@k6 run --out json=load-tests/results/stress-summary.json --out csv=load-tests/results/stress-metrics.csv load-tests/scenarios/stress/stress.js
	@echo "✅ Stress load tests complete! Check results in load-tests/results/"

load-test-spike: ## Run spike load tests (sudden load increase)
	@echo "🚀 Running spike load tests..."
	@mkdir -p load-tests/results
	@k6 run --out json=load-tests/results/spike-summary.json --out csv=load-tests/results/spike-metrics.csv load-tests/scenarios/spike/spike.js
	@echo "✅ Spike load tests complete! Check results in load-tests/results/"

load-test-soak: ## Run soak load tests (sustained load)
	@echo "🚀 Running soak load tests..."
	@mkdir -p load-tests/results
	@k6 run --out json=load-tests/results/soak-summary.json --out csv=load-tests/results/soak-metrics.csv load-tests/scenarios/soak/soak.js
	@echo "✅ Soak load tests complete! Check results in load-tests/results/"

load-test-simple: ## Run simple baseline tests (public endpoints only, no auth required)
	@echo "🚀 Running simple baseline load tests (public endpoints only)..."
	@mkdir -p load-tests/results
	@k6 run --out json=load-tests/results/simple-baseline-summary.json --out csv=load-tests/results/simple-baseline-metrics.csv load-tests/scenarios/baseline/simple-baseline.js
	@echo "✅ Simple baseline load tests complete! Check results in load-tests/results/"

load-test-all: load-test-baseline load-test-stress load-test-spike load-test-soak ## Run all load test scenarios
	@echo "✅ All load tests complete!"

# =============================================================================
# Database Operations
# =============================================================================

db-reset-all: db-drop-all db-build-all ## Drop and rebuild all databases (PostgreSQL + MongoDB)
	@echo "✅ Database reset complete!"

db-reset: db-reset-all ## Reset all databases (drop and recreate) - alias for db-reset-all

db-setup: ## Create databases for the first time
	@echo "Creating databases..."
	@psql -d postgres -c "CREATE USER pulse_user WITH PASSWORD 'pulse_user';" 2>/dev/null || echo "User already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_users OWNER pulse_user;" 2>/dev/null || echo "pulse_users already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_posts OWNER pulse_user;" 2>/dev/null || echo "pulse_posts already exists"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_users TO pulse_user;"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_posts TO pulse_user;"
	@echo "Initializing schemas..."
	@cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_users" npx prisma db push --skip-generate
	@psql -U pulse_user -d pulse_posts -f post-service/init.sql
	@echo "✅ Database setup complete!"

# Database Reset Commands
db-drop-all: ## Drop all databases (PostgreSQL + MongoDB)
	@echo "🗑️  Dropping all databases..."
	@echo "Dropping PostgreSQL databases..."
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_users WITH (FORCE);" 2>/dev/null || true
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_posts WITH (FORCE);" 2>/dev/null || true
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_social WITH (FORCE);" 2>/dev/null || true
	@echo "Dropping MongoDB databases..."
	@mongosh --eval "db = db.getSiblingDB('pulse_notifications'); db.dropDatabase();" 2>/dev/null || true
	@mongosh --eval "db = db.getSiblingDB('messaging_db'); db.dropDatabase();" 2>/dev/null || true
	@echo "✅ All databases dropped!"

db-build-all: ## Build all databases (PostgreSQL + MongoDB)
	@echo "🏗️  Building all databases..."
	@echo "Creating PostgreSQL databases..."
	@psql -d postgres -c "CREATE DATABASE pulse_users OWNER pulse_user;" 2>/dev/null || echo "pulse_users already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_posts OWNER pulse_user;" 2>/dev/null || echo "pulse_posts already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_social OWNER pulse_user;" 2>/dev/null || echo "pulse_social already exists"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_users TO pulse_user;"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_posts TO pulse_user;"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_social TO pulse_user;"
	@echo "Applying PostgreSQL schemas..."
	@cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_users" npx prisma db push --skip-generate
	@cd social-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_social" npx prisma db push --skip-generate
	@psql -U pulse_user -d pulse_posts -f post-service/init.sql
	@echo "Creating MongoDB databases and collections..."
	@mongosh < config/mongodb/init.js 2>/dev/null || echo "MongoDB initialization completed"
	@echo "✅ All databases built!"
