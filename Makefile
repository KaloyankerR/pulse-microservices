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
	@echo "\033[1mKubernetes Operations:\033[0m"
	@grep -E '^k8s-(start|stop|build|deploy|delete|clean|logs-|status|port-forward):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'
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

db-migrate: ## Apply Prisma migrations to all services
	@echo "🔄 Applying database migrations..."
	@echo "  → Migrating auth-service..."
	@cd auth-service && DATABASE_URL="postgresql://pulse_auth:pulse_auth@localhost:5432/pulse_auth_db" npx prisma migrate deploy 2>/dev/null || \
		(cd auth-service && DATABASE_URL="postgresql://pulse_auth:pulse_auth@localhost:5432/pulse_auth_db" npx prisma db push --skip-generate && echo "    ✅ Auth service schema updated")
	@cd auth-service && DATABASE_URL="postgresql://pulse_auth:pulse_auth@localhost:5432/pulse_auth_db" npx prisma generate 2>/dev/null || echo "    ⚠️  Auth service Prisma generate failed"
	@echo "  → Migrating user-service..."
	@cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_user_db" npx prisma migrate deploy 2>/dev/null || \
		(cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_user_db" npx prisma db push --skip-generate && echo "    ✅ User service schema updated")
	@echo "  → Migrating social-service..."
	@cd social-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_social" npx prisma migrate deploy 2>/dev/null || \
		(cd social-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_social" npx prisma db push --skip-generate && echo "    ✅ Social service schema updated")
	@echo "✅ All migrations applied!"

db-setup: ## Create databases for the first time
	@echo "Creating databases and users..."
	@psql -d postgres -c "CREATE USER pulse_auth WITH PASSWORD 'pulse_auth';" 2>/dev/null || echo "User pulse_auth already exists"
	@psql -d postgres -c "CREATE USER pulse_user WITH PASSWORD 'pulse_user';" 2>/dev/null || echo "User pulse_user already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_auth_db OWNER pulse_auth;" 2>/dev/null || echo "pulse_auth_db already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_user_db OWNER pulse_user;" 2>/dev/null || echo "pulse_user_db already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_posts OWNER pulse_user;" 2>/dev/null || echo "pulse_posts already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_social OWNER pulse_user;" 2>/dev/null || echo "pulse_social already exists"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_auth_db TO pulse_auth;"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_user_db TO pulse_user;"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_posts TO pulse_user;"
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_social TO pulse_user;"
	@echo "Initializing schemas..."
	@cd auth-service && DATABASE_URL="postgresql://pulse_auth:pulse_auth@localhost:5432/pulse_auth_db" npx prisma db push --skip-generate || echo "⚠️  Auth service schema push failed (may need manual migration)"
	@cd auth-service && DATABASE_URL="postgresql://pulse_auth:pulse_auth@localhost:5432/pulse_auth_db" npx prisma generate || echo "⚠️  Auth service Prisma generate failed"
	@cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_user_db" npx prisma db push --skip-generate || echo "⚠️  User service schema push failed"
	@cd social-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_social" npx prisma db push --skip-generate || echo "⚠️  Social service schema push failed"
	@psql -U pulse_user -d pulse_posts -f post-service/init.sql 2>/dev/null || echo "⚠️  Post service init.sql failed (may already be applied)"
	@echo "Creating MongoDB databases and collections..."
	@mongosh < config/mongodb/init.js 2>/dev/null || echo "⚠️  MongoDB initialization completed or skipped"
	@echo "✅ Database setup complete!"

# Database Reset Commands
db-drop-all: ## Drop all databases (PostgreSQL + MongoDB)
	@echo "🗑️  Dropping all databases..."
	@echo "Dropping PostgreSQL databases..."
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_auth_db WITH (FORCE);" 2>/dev/null || true
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_user_db WITH (FORCE);" 2>/dev/null || true
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_users WITH (FORCE);" 2>/dev/null || true
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_posts WITH (FORCE);" 2>/dev/null || true
	@psql -d postgres -c "DROP DATABASE IF EXISTS pulse_social WITH (FORCE);" 2>/dev/null || true
	@echo "Dropping MongoDB databases..."
	@mongosh --eval "db = db.getSiblingDB('pulse_notifications'); db.dropDatabase();" 2>/dev/null || true
	@mongosh --eval "db = db.getSiblingDB('messaging_db'); db.dropDatabase();" 2>/dev/null || true
	@echo "✅ All databases dropped!"

db-build-all: ## Build all databases (PostgreSQL + MongoDB)
	@echo "🏗️  Building all databases..."
	@echo "Creating PostgreSQL users..."
	@psql -d postgres -c "CREATE USER pulse_auth WITH PASSWORD 'pulse_auth';" 2>/dev/null || echo "User pulse_auth already exists"
	@psql -d postgres -c "CREATE USER pulse_user WITH PASSWORD 'pulse_user';" 2>/dev/null || echo "User pulse_user already exists"
	@echo "Creating PostgreSQL databases..."
	@psql -d postgres -c "CREATE DATABASE pulse_auth_db OWNER pulse_auth;" 2>/dev/null || echo "pulse_auth_db already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_user_db OWNER pulse_user;" 2>/dev/null || echo "pulse_user_db already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_users OWNER pulse_user;" 2>/dev/null || echo "pulse_users already exists (legacy)"
	@psql -d postgres -c "CREATE DATABASE pulse_posts OWNER pulse_user;" 2>/dev/null || echo "pulse_posts already exists"
	@psql -d postgres -c "CREATE DATABASE pulse_social OWNER pulse_user;" 2>/dev/null || echo "pulse_social already exists"
	@echo "Granting privileges..."
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_auth_db TO pulse_auth;" 2>/dev/null || true
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_user_db TO pulse_user;" 2>/dev/null || true
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_users TO pulse_user;" 2>/dev/null || true
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_posts TO pulse_user;" 2>/dev/null || true
	@psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pulse_social TO pulse_user;" 2>/dev/null || true
	@echo "Applying PostgreSQL schemas..."
	@echo "  → Applying auth-service schema..."
	@cd auth-service && DATABASE_URL="postgresql://pulse_auth:pulse_auth@localhost:5432/pulse_auth_db" npx prisma db push --skip-generate 2>/dev/null || echo "    ⚠️  Auth service schema push failed (may need manual migration)"
	@cd auth-service && DATABASE_URL="postgresql://pulse_auth:pulse_auth@localhost:5432/pulse_auth_db" npx prisma generate 2>/dev/null || echo "    ⚠️  Auth service Prisma generate failed"
	@echo "  → Applying user-service schema..."
	@cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_user_db" npx prisma db push --skip-generate 2>/dev/null || echo "    ⚠️  User service schema push failed"
	@echo "  → Applying social-service schema..."
	@cd social-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_social" npx prisma db push --skip-generate 2>/dev/null || echo "    ⚠️  Social service schema push failed"
	@echo "  → Applying post-service schema..."
	@psql -U pulse_user -d pulse_posts -f post-service/init.sql 2>/dev/null || echo "    ⚠️  Post service init.sql failed (may already be applied)"
	@echo "Creating MongoDB databases and collections..."
	@mongosh < config/mongodb/init.js 2>/dev/null || echo "⚠️  MongoDB initialization completed or skipped"
	@echo "✅ All databases built!"

# =============================================================================
# Kubernetes Operations
# =============================================================================

k8s-start: ## Start Minikube cluster
	@echo "Checking Docker daemon..."
	@docker info > /dev/null 2>&1 || (echo "❌ Error: Docker daemon is not running. Please start Docker Desktop and try again." && exit 1)
	@echo "Starting Minikube cluster..."
	@minikube start --memory=4096 --cpus=2 --kubernetes-version=v1.30.0 || (echo "❌ Error: Failed to start Minikube cluster" && exit 1)
	@echo "Waiting for Minikube to be ready..."
	@kubectl wait --for=condition=Ready node --all --timeout=120s || (echo "❌ Error: Cluster nodes not ready" && exit 1)
	@minikube addons enable ingress || echo "⚠️  Warning: Failed to enable ingress addon (may already be enabled)"
	@minikube addons enable storage-provisioner || echo "⚠️  Warning: Failed to enable storage-provisioner addon (may already be enabled)"
	@minikube addons enable default-storageclass || echo "⚠️  Warning: Failed to enable default-storageclass addon (may already be enabled)"
	@kubectl cluster-info > /dev/null 2>&1 || (echo "❌ Error: Cannot verify cluster connection" && exit 1)
	@echo "✅ Minikube cluster is ready!"
	@echo "💡 To install ArgoCD (optional): make k8s-argocd-install"

k8s-stop: ## Stop Minikube cluster
	@minikube stop

k8s-build: ## Build all Docker images
	@echo "Setting up Minikube Docker environment..."
	@eval $$(minikube docker-env) && \
	echo "Building auth-service..." && \
	docker build -f docker/nodejs-service.Dockerfile --build-arg SERVICE_PORT=8080 -t pulse-auth-service:latest ./auth-service && \
	echo "Building user-service..." && \
	docker build -f docker/nodejs-service.Dockerfile --build-arg SERVICE_PORT=8081 -t pulse-user-service:latest ./user-service && \
	echo "Building post-service..." && \
	docker build -t pulse-post-service:latest ./post-service && \
	echo "Building social-service..." && \
	docker build -t pulse-social-service:latest ./social-service && \
	echo "Building messaging-service..." && \
	docker build -t pulse-messaging-service:latest ./messaging-service && \
	echo "Building notification-service..." && \
	docker build -t pulse-notification-service:latest ./notification-service && \
	echo "Building event-service..." && \
	docker build -t pulse-event-service:latest ./event-service && \
	echo "Building frontend..." && \
	docker build -t pulse-frontend:latest ./frontend && \
	echo "All images built successfully!"

k8s-deploy: ## Deploy all services
	@kubectl apply -f k8s/namespaces/ && \
	kubectl apply -f k8s/secrets/ && \
	kubectl apply -f k8s/configmaps/ && \
	kubectl apply -f k8s/databases/ && \
	kubectl apply -f k8s/services/ && \
	kubectl apply -f k8s/gateway/ && \
	kubectl apply -f k8s/frontend/ && \
	kubectl apply -f k8s/monitoring/ && \
	kubectl apply -f k8s/ingress/ || true
	@kubectl wait --for=condition=ready pod -l app=postgres -n pulse --timeout=120s || true
	@kubectl apply -f k8s/databases/postgres-init-job.yaml || true

k8s-delete: ## Delete all Kubernetes resources
	@pkill -f "kubectl port-forward" || true
	@kubectl delete namespace pulse --ignore-not-found=true

k8s-clean: ## Clean up Docker images and Minikube storage
	@echo "Cleaning up Docker images..."
	@eval $$(minikube docker-env) && docker system prune -af --volumes || true
	@echo "Cleaning up Minikube..."
	@minikube ssh -- docker system prune -af || true

k8s-logs-%: ## View logs for a service (e.g., k8s-logs-auth-service)
	@pod=$$(kubectl get pods -n pulse -l app=$* -o jsonpath='{.items[0].metadata.name}' 2>/dev/null); \
	if [ -z "$$pod" ]; then echo "❌ Service $* not found"; exit 1; fi; \
	kubectl logs -f -n pulse $$pod

k8s-status: ## Show pod status
	@kubectl get pods -n pulse

k8s-port-forward: ## Port forward services (frontend:3000, kong:8000, messaging:8084)
	@pkill -f "kubectl port-forward" || true
	@kubectl port-forward -n pulse service/frontend 3000:3000 & \
	kubectl port-forward -n pulse service/kong 8000:8000 8001:8001 & \
	kubectl port-forward -n pulse service/messaging-service 8084:8084 & \
	wait

# =============================================================================
# ArgoCD Operations
# =============================================================================

k8s-argocd-install: ## Install ArgoCD in argocd namespace (requires cluster to be running)
	@echo "Checking cluster connection..."
	@kubectl cluster-info > /dev/null 2>&1 || (echo "❌ Error: Cannot connect to cluster. Make sure minikube is running: make k8s-start" && exit 1)
	@echo "Installing ArgoCD..."
	@kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
	@kubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml || \
	kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	@echo "Waiting for ArgoCD to be ready..."
	@kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s || true
	@echo "✅ ArgoCD installed successfully!"
	@echo "📝 Get admin password: make k8s-argocd-get-password"
	@echo "🌐 Access UI: make k8s-argocd-port-forward"

k8s-argocd-uninstall: ## Uninstall ArgoCD
	@echo "Uninstalling ArgoCD..."
	@kubectl delete namespace argocd --ignore-not-found=true
	@echo "✅ ArgoCD uninstalled"

k8s-argocd-get-password: ## Get ArgoCD admin password
	@kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo

k8s-argocd-port-forward: ## Port forward ArgoCD UI (http://localhost:8080)
	@echo "Port-forwarding ArgoCD UI to http://localhost:8080..."
	@echo "Username: admin"
	@echo "Password: Run 'make k8s-argocd-get-password' to get the password"
	@kubectl port-forward -n argocd svc/argocd-server 8080:443

k8s-argocd-create-app: ## Create ArgoCD Application for Pulse microservices
	@kubectl apply -f k8s/argocd/pulse-app.yaml
	@echo "✅ ArgoCD Application created"
	@echo "📝 Update k8s/argocd/pulse-app.yaml with your Git repository URL"

k8s-start-with-argocd: ## Start Minikube cluster and install ArgoCD
	@$(MAKE) k8s-start
	@echo ""
	@echo "Installing ArgoCD..."
	@$(MAKE) k8s-argocd-install
