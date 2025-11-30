# Week 9 Progress Report

**Date:** 11.11.2025  
**Student Name:** Kaloyan Kulov  
**Week Focus:** Auth/User service split, moderator tooling, load testing, and Kubernetes rollout

---

## Highlights
- Extracted authentication into a standalone `auth-service`, leaving profile and social data in `user-service`, and added database migration support for the split.
- Refreshed the frontend to consume the new auth endpoints and shipped a moderator dashboard that controls bans, deletions, and role-only screens.
- Built a reusable k6 load-testing suite with automated scenarios wired into the root `Makefile`.
- Established the first Kubernetes deployment baseline with manifests, a migration guide, and helper Make targets.

---

## Technical Evidence

**Auth/User Separation**

- `auth-service` now owns registration, token lifecycle, and moderator role management behind shared rate limiting.

```13:27:auth-service/src/routes/auth.ts
router.post('/register', validateRequest(schemas.register), authController.register);
router.post('/login', validateRequest(schemas.login), authController.login);
router.post('/refresh', validateRequest(schemas.refreshToken), authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.post('/users/:id/role', requireModerator, authController.updateUserRole);
```

- `user-service` exposes profile CRUD plus moderator-only ban/unban flows while reusing shared middleware.

```20:37:user-service/src/routes/users.ts
router.get('/all', authenticateToken, requireModerator, validateRequest(schemas.pagination, 'query'), userController.getAllUsers);
router.put('/:id', authenticateToken, validateRequest(schemas.updateProfile), userController.updateProfile);
router.delete('/:id', authenticateToken, userController.deleteUser);
router.post('/:id/ban', authenticateToken, requireModerator, userController.banUser);
router.post('/:id/unban', authenticateToken, requireModerator, userController.unbanUser);
```

- Data migration is documented to keep auth credentials and profiles in sync after the split.

```15:48:user-service/scripts/migrate-user-to-auth-user.sql
INSERT INTO auth_service.users (id, email, password_hash, created_at, updated_at)
SELECT id, email, password_hash, created_at, updated_at
FROM user_service.users;
INSERT INTO auth_service.user_sessions (id, user_id, token_hash, expires_at, created_at)
SELECT id, user_id, token_hash, expires_at, created_at
FROM user_service.user_sessions;
```

**Frontend & Moderator Experience**

- The frontend auth client targets the new service endpoints and normalises responses before storing tokens.

```12:60:frontend/lib/api/auth.ts
const response = await apiClient.post<AuthResponse>(
  API_ENDPOINTS.auth.login,
  credentials
);
apiClient.setAuthTokens(
  response.data.accessToken,
  response.data.refreshToken
);
```

- The moderator dashboard is gated by the new `MODERATOR` role and offers ban/unban/delete workflows along with pagination.

```29:311:frontend/app/moderator/page.tsx
if (currentUser?.role !== 'MODERATOR') {
  router.push('/');
  return;
}
const response = await usersApi.getAllUsers(page, 20);
await usersApi.banUser(user.id);
await usersApi.unbanUser(user.id);
await usersApi.deleteUser(user.id);
```

**Load Testing Automation**

- The k6 suite documents baseline, stress, spike, and soak scenarios that hit every microservice through Kong.

```7:82:load-tests/README.md
The load testing suite tests all microservices through the Kong API Gateway (port 8000) with multiple test scenarios:
- **Baseline**: Normal load tests (10-50 VUs, 1-5 min duration)
- **Stress**: Breaking point tests (ramp up to 200+ VUs)
- **Spike**: Sudden load increase tests (0→100→0 VUs quickly)
- **Soak**: Sustained load tests (50 VUs for 30+ minutes)
```

- Root `Makefile` targets wrap user creation and every scenario so tests can run with a single command.

```220:255:Makefile
load-test-create-user: ## Create test user for load testing
	@cd load-tests && ./scripts/create-test-user.sh
load-test-baseline: load-test-create-user ## Run baseline load tests (normal load)
	@k6 run --out json=load-tests/results/baseline-summary.json ...
load-test-all: load-test-baseline load-test-stress load-test-spike load-test-soak ## Run all load test scenarios
```

**Kubernetes Foundation**

- Added a migration guide covering Minikube setup, database bootstrapping, monitoring, and cleanup steps.

```1:172:k8s/KUBERNETES_MIGRATION_GUIDE.md
## Quick Start
make k8s-start
make k8s-build
make k8s-deploy-all
This deploys databases, seven microservices, Kong gateway, frontend, and monitoring stack inside the `pulse` namespace.
```

- New `k8s-*` Make targets streamline building images, applying manifests, checking status, and port-forwarding.

```351:400:Makefile
k8s-start: ## Start Minikube cluster
	@minikube start --memory=4096 --cpus=2 || true
k8s-deploy: ## Deploy all services
	@kubectl apply -f k8s/namespaces/ && kubectl apply -f k8s/secrets/ ...
k8s-status: ## Show pod status
	@kubectl get pods -n pulse
```

---

## Learning Outcome Reflections & Self-Assessment

### Learning Outcome 1: Professional Standard
- Formalised service boundaries by moving auth responsibilities into a hardened `auth-service` with clear routing and error handling.
- Documented the data migration path to keep credentials and profiles consistent post-split.
- **Self-Grade:** Beginning

### Learning Outcome 2: Personal Leadership
- Prioritised the service separation, frontend alignment, and moderation tooling within one sprint and delivered cohesive outcomes.
- Coordinated supporting docs (migration SQL, k6 README, Kubernetes guide) so teammates can repeat the workflows.
- **Self-Grade:** Beginning

### Learning Outcome 3: Scalable Architectures
- Added moderator-only API gates, rate limiting, and service routing adjustments that keep the architecture modular as features grow.
- Introduced paginated moderator listings and scriptable migrations that support future data scaling.
- **Self-Grade:** Beginning

### Learning Outcome 4: Development and Operations (DevOps)
- Automated k6 scenarios and load-test commands in the root `Makefile`, aligning testing with operational scripts.
- Extended shared logging, rate limiting, and metrics exposure across the newly created `auth-service`.
- **Self-Grade:** Beginning

### Learning Outcome 5: Cloud Native
- Produced a Kubernetes migration guide and Make targets that streamline Minikube bootstrapping, deployments, and monitoring access.
- Ensured manifests cover core dependencies (databases, gateway, frontend, monitoring) under a single namespace.
- **Self-Grade:** Beginning

### Learning Outcome 6: Security by Design
- Restricted moderator actions to the new `MODERATOR` role in both backend middleware and frontend guard logic.
- Kept token handling centralised in `auth-service`, reducing credential exposure in other services.
- **Self-Grade:** Beginning

### Learning Outcome 7: Distributed Data
- Planned the auth/user database split with explicit migration steps to preserve relational integrity across services.
- Maintained follow and session data flows through dedicated schemas, ready for independent scaling.
- **Self-Grade:** Beginning

---

## Next Steps
- Roll moderator role management into the frontend settings panel so admins can promote/demote without direct API calls.
- Capture baseline metrics from the new load tests and feed them into Prometheus/Grafana dashboards for regression tracking.
- Extend Kubernetes manifests with secrets management and horizontal pod autoscaling once initial smoke tests pass.

---

