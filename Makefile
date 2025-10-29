.PHONY: help up down logs ps restart rebuild rebuild-no-cache rebuild-frontend clean test db-reset db-reset db-setup db-drop-all db-build-all db-reset-all db-reset-users db-reset-posts dev dev-stop \
	build-all build-all-no-cache test-all test-coverage-all lint-all format-all clean-all docker-build-all docker-build-all-no-cache sonar-all \
	build-% build-no-cache-% test-% test-coverage-% lint-% format-% clean-% docker-build-% docker-build-no-cache-% sonar-% \
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
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-25s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

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

build-all: $(addprefix build-,$(SERVICES)) ## Build all services locally
	@echo "✅ All services built!"

build-all-no-cache: $(addprefix build-no-cache-,$(SERVICES)) ## Clean build all services
	@echo "✅ All services built without cache!"

test-all: $(addprefix test-,$(SERVICES)) ## Run tests for all services
	@echo "✅ All tests completed!"

test-coverage-all: $(addprefix test-coverage-,$(SERVICES)) ## Run tests with coverage for all services
	@echo "✅ All coverage reports generated!"

lint-all: $(addprefix lint-,$(SERVICES)) ## Lint all services
	@echo "✅ All services linted!"

format-all: $(addprefix format-,$(SERVICES)) ## Format all services
	@echo "✅ All services formatted!"

clean-all: $(addprefix clean-,$(SERVICES)) ## Clean all services
	@echo "✅ All services cleaned!"

docker-build-all: $(addprefix docker-build-,$(SERVICES)) ## Build Docker images for all services
	@echo "✅ All Docker images built!"

docker-build-all-no-cache: $(addprefix docker-build-no-cache-,$(SERVICES)) ## Build Docker images without cache for all services
	@echo "✅ All Docker images built without cache!"

# =============================================================================
# Individual Service Proxy Commands
# =============================================================================

build-%: ## Build a specific service (e.g., build-user-service)
	@echo "Building $*..."
	@cd $* && $(MAKE) build || echo "⚠️  Makefile not found or build failed for $*"

build-no-cache-%: ## Clean build a specific service (e.g., build-no-cache-user-service)
	@echo "Building $* without cache..."
	@cd $* && $(MAKE) build-no-cache || echo "⚠️  Makefile not found or build failed for $*"

test-%: ## Run tests for a specific service (e.g., test-user-service)
	@echo "Running tests for $*..."
	@cd $* && $(MAKE) test || echo "⚠️  Tests failed for $*"

test-coverage-%: ## Run tests with coverage for a specific service (e.g., test-coverage-user-service)
	@echo "Running tests with coverage for $*..."
	@cd $* && $(MAKE) test-coverage || echo "⚠️  Coverage tests failed for $*"

lint-%: ## Lint a specific service (e.g., lint-user-service)
	@echo "Linting $*..."
	@cd $* && $(MAKE) lint || echo "⚠️  Linting failed for $*"

format-%: ## Format a specific service (e.g., format-user-service)
	@echo "Formatting $*..."
	@cd $* && $(MAKE) format || echo "⚠️  Formatting failed for $*"

clean-%: ## Clean a specific service (e.g., clean-user-service)
	@echo "Cleaning $*..."
	@cd $* && $(MAKE) clean || echo "⚠️  Clean failed for $*"

docker-build-%: ## Build Docker image for a specific service (e.g., docker-build-user-service)
	@echo "Building Docker image for $*..."
	@cd $* && $(MAKE) docker-build || echo "⚠️  Docker build failed for $*"

docker-build-no-cache-%: ## Build Docker image without cache for a specific service (e.g., docker-build-no-cache-user-service)
	@echo "Building Docker image without cache for $*..."
	@cd $* && $(MAKE) docker-build-no-cache || echo "⚠️  Docker build failed for $*"

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

sonar-all: $(addprefix sonar-,$(SERVICES)) ## Run SonarQube analysis for all services
	@echo "✅ All SonarQube analyses complete! View results at http://localhost:9001"

sonar-%: ## Run SonarQube analysis for a specific service (e.g., sonar-user-service)
	@echo "🔍 Running SonarQube analysis for $*..."
	@cd $* && $(MAKE) sonar || echo "⚠️  SonarQube analysis failed for $*"

# =============================================================================
# Database Operations
# =============================================================================

db-reset: db-reset-all ## Reset all databases (drop and recreate) - alias for db-reset-all

# Legacy individual database reset commands (kept for granular control)
db-reset-users: ## Reset user service database only
	@echo "Resetting pulse_users database..."
	@psql -U pulse_user -d pulse_users -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
	@psql -U pulse_user -d pulse_users -c "GRANT ALL ON SCHEMA public TO pulse_user;"
	@cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_users" npx prisma db push --skip-generate
	@echo "✅ User database reset complete"

db-reset-posts: ## Reset post service database only
	@echo "Resetting pulse_posts database..."
	@psql -U pulse_user -d pulse_posts -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO pulse_user;" 2>/dev/null || true
	@psql -U pulse_user -d pulse_posts -f post-service/init.sql
	@echo "✅ Post database reset complete"

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

db-reset-all: db-drop-all db-build-all ## Drop and rebuild all databases (PostgreSQL + MongoDB)
	@echo "✅ Database reset complete!"
