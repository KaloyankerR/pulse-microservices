.PHONY: help up down logs ps restart rebuild clean test db-reset db-reset-users db-reset-posts

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

ps: ## List running services
	docker-compose ps

restart: ## Restart all services
	docker-compose restart

rebuild: ## Rebuild and restart all services
	docker-compose up -d --build

rebuild-no-cache: ## Force rebuild all services without cache
	docker-compose build --no-cache
	docker-compose up -d

rebuild-web: ## Rebuild only web-client
	docker-compose build --no-cache web-client
	docker-compose up -d web-client

dev: ## Start development environment with hot reload
	docker-compose --profile dev up -d web-client-dev

dev-stop: ## Stop development environment
	docker-compose --profile dev down web-client-dev

clean: ## Stop services and remove volumes
	docker-compose down -v

test: ## Run basic health checks
	@echo "Testing services..."
	@curl -s http://localhost:8000/health > /dev/null && echo "✅ User service is healthy" || echo "❌ User service failed"
	@curl -s http://localhost:8000/api/v1/posts > /dev/null && echo "✅ Post service is healthy" || echo "❌ Post service failed"
	@curl -s http://localhost:8086/health > /dev/null && echo "✅ Notification service is healthy" || echo "❌ Notification service failed"
	@echo "Done!"

test-user: ## Run user-service tests
	@echo "Running user-service tests..."
	@cd user-service && npm test

test-coverage-user: ## Run user-service tests with coverage
	@echo "Running user-service tests with coverage..."
	@cd user-service && npm run test:coverage

test-notification: ## Run notification-service tests
	@echo "Running notification-service tests..."
	@cd notification-service && npm test

test-coverage-notification: ## Run notification-service tests with coverage
	@echo "Running notification-service tests with coverage..."
	@cd notification-service && npm run test:coverage

test-social: ## Run social-service tests
	@echo "Running social-service tests..."
	@cd social-service && npm test

test-coverage-social: ## Run social-service tests with coverage
	@echo "Running social-service tests with coverage..."
	@cd social-service && npm run test:coverage

test-post: ## Run post-service tests
	@echo "Running post-service tests..."
	@cd post-service && go test ./... -v

test-messaging: ## Run messaging-service tests
	@echo "Running messaging-service tests..."
	@cd messaging-service && go test ./... -v

# SonarQube Analysis Commands
sonar-all: ## Run SonarQube analysis for all services
	@echo "🔍 Running SonarQube analysis for all microservices..."
	@$(MAKE) sonar-user
	@$(MAKE) sonar-notification
	@$(MAKE) sonar-social
	@$(MAKE) sonar-post
	@$(MAKE) sonar-messaging
	@echo "✅ All SonarQube analyses complete! View results at http://localhost:9001"

sonar-user: ## Run SonarQube analysis for user-service
	@echo "🔍 [1/5] Analyzing user-service..."
	@cd user-service && npm run test:coverage && SONAR_TOKEN=sqa_63d4c5db10ae941741a4a5d1928a51105119a85f npm run sonar
	@echo "✅ User service analysis complete"

sonar-notification: ## Run SonarQube analysis for notification-service
	@echo "🔍 [2/5] Analyzing notification-service..."
	@cd notification-service && npm run test && SONAR_TOKEN=sqa_63d4c5db10ae941741a4a5d1928a51105119a85f npm run sonar
	@echo "✅ Notification service analysis complete"

sonar-social: ## Run SonarQube analysis for social-service
	@echo "🔍 [3/5] Analyzing social-service..."
	@cd social-service && npm run test:coverage || true
	@cd social-service && SONAR_TOKEN=sqa_63d4c5db10ae941741a4a5d1928a51105119a85f npm run sonar
	@echo "✅ Social service analysis complete"

sonar-post: ## Run SonarQube analysis for post-service
	@echo "🔍 [4/5] Analyzing post-service..."
	@cd post-service && go test ./... -coverprofile=coverage.out || true
	@cd post-service && SONAR_TOKEN=sqa_63d4c5db10ae941741a4a5d1928a51105119a85f sonar-scanner
	@echo "✅ Post service analysis complete"

sonar-messaging: ## Run SonarQube analysis for messaging-service
	@echo "🔍 [5/5] Analyzing messaging-service..."
	@cd messaging-service && go test ./... -coverprofile=coverage.out || true
	@cd messaging-service && SONAR_TOKEN=sqa_63d4c5db10ae941741a4a5d1928a51105119a85f sonar-scanner
	@echo "✅ Messaging service analysis complete"


db-reset: db-reset-users db-reset-posts ## Reset all databases (drop and recreate)
	@echo "✅ All databases reset complete!"

db-reset-users: ## Reset user service database
	@echo "Resetting pulse_users database..."
	@psql -U pulse_user -d pulse_users -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
	@psql -U pulse_user -d pulse_users -c "GRANT ALL ON SCHEMA public TO pulse_user;"
	@cd user-service && npx prisma db push --skip-generate
	@echo "✅ User database reset complete"

db-reset-posts: ## Reset post service database
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
	@cd user-service && npx prisma db push --skip-generate
	@psql -U pulse_user -d pulse_posts -f post-service/init.sql
	@echo "✅ Database setup complete!"
