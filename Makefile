.PHONY: help up down logs ps restart rebuild clean test db-reset db-reset-users db-reset-posts jenkins-up jenkins-down jenkins-logs jenkins-restart jenkins-rebuild

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

clean: ## Stop services and remove volumes
	docker-compose down -v

test: ## Run basic health checks
	@echo "Testing services..."
	@curl -s http://localhost:8000/health > /dev/null && echo "✅ User service is healthy" || echo "❌ User service failed"
	@curl -s http://localhost:8000/api/v1/posts > /dev/null && echo "✅ Post service is healthy" || echo "❌ Post service failed"
	@echo "Done!"

test-user: ## Run user-service tests
	@echo "Running user-service tests..."
	@cd user-service && npm test

test-coverage-user: ## Run user-service tests with coverage
	@echo "Running user-service tests with coverage..."
	@cd user-service && npm run test:coverage

sonar-user: ## Run SonarQube analysis for user-service
	@echo "Running SonarQube analysis for user-service..."
	@cd user-service && npm run test:coverage && npm run sonar

jenkins-up: ## Start Jenkins service only
	@echo "Starting Jenkins..."
	@docker-compose up -d jenkins
	@echo "✅ Jenkins started at http://localhost:8090"
	@echo "Username: admin, Password: admin"

jenkins-down: ## Stop Jenkins service
	@echo "Stopping Jenkins..."
	@docker-compose stop jenkins

jenkins-logs: ## View Jenkins logs
	@echo "Viewing Jenkins logs..."
	@docker-compose logs -f jenkins

jenkins-restart: ## Restart Jenkins service
	@echo "Restarting Jenkins..."
	@docker-compose restart jenkins

jenkins-rebuild: ## Rebuild and restart Jenkins service
	@echo "Rebuilding Jenkins..."
	@docker-compose up -d --build jenkins
	@echo "✅ Jenkins rebuilt and started at http://localhost:8090"

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
