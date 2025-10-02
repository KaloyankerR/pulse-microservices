# GitHub Actions CI/CD Guide for Pulse Microservices

## Overview

This project implements a comprehensive CI/CD pipeline using **GitHub Actions matrix strategy** to efficiently test, build, and deploy multiple microservices in parallel. The matrix approach dramatically reduces CI time while ensuring thorough testing across multiple runtime versions.

## 📊 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions Pipeline                  │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐            ┌──────▼──────┐
         │  On Push/PR │            │   On Tag    │
         └──────┬──────┘            └──────┬──────┘
                │                           │
    ┌───────────┴───────────┐              │
    │                       │              │
┌───▼────┐           ┌─────▼─────┐   ┌────▼────┐
│   CI   │           │    PR     │   │  Deploy │
│        │           │ Validation│   │         │
└───┬────┘           └───────────┘   └────┬────┘
    │                                      │
    └────────┬─────────────────────────────┘
             │
    ┌────────▼────────┐
    │  Matrix Build   │
    │  ┌────────────┐ │
    │  │ Node 18/20 │ │
    │  │  Go 1.21+  │ │
    │  │ 4 Services │ │
    │  └────────────┘ │
    └─────────────────┘
```

## 🚀 Workflows

### 1. CI Workflow (ci.yml)

**Purpose**: Continuous Integration for all microservices

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Key Features**:

#### Smart Change Detection
```yaml
detect-changes:
  outputs:
    user-service: ${{ steps.filter.outputs.user-service }}
    social-service: ${{ steps.filter.outputs.social-service }}
    ...
```
- Only tests services that have changed
- Saves compute resources and time
- Uses `dorny/paths-filter` action

#### Matrix Testing for Node.js Services
```yaml
strategy:
  matrix:
    service: [user-service, social-service]
    node-version: [18.x, 20.x]
```

**What it does**:
- Tests both services on Node 18 and 20
- Runs 4 jobs in parallel (2 services × 2 versions)
- Each job gets PostgreSQL and Redis containers
- Runs Prisma migrations and generates client
- Executes lint checks and test suites
- Uploads coverage to Codecov

#### Matrix Testing for Go Services
```yaml
strategy:
  matrix:
    service: [messaging-service, post-service]
    go-version: ['1.21', '1.22']
```

**What it does**:
- Tests both Go services on Go 1.21 and 1.22
- Runs 4 jobs in parallel (2 services × 2 versions)
- Spins up PostgreSQL, Redis, and RabbitMQ
- Checks code formatting (`go fmt`)
- Runs static analysis (`go vet`)
- Executes race detector tests
- Uploads coverage reports

#### Docker Image Building
```yaml
build-docker-images:
  strategy:
    matrix:
      service: [user-service, social-service, messaging-service, post-service]
```

- Validates Docker builds for all services
- Uses BuildKit caching for faster builds
- Only runs if tests pass

**Execution Time**:
- Without matrix: ~40 minutes
- With matrix: ~10 minutes (75% reduction!)

---

### 2. Deploy Workflow (deploy.yml)

**Purpose**: Automated deployment to production environments

**Triggers**:
- Version tags: `v*.*.*`
- Service-specific tags: `user-service-v*.*.*`
- Manual workflow dispatch

**Key Features**:

#### Dynamic Service Selection
```yaml
determine-services:
  # Determines which services to deploy based on tag or manual input
```

**Tag Examples**:
```bash
# Deploy all services
git tag v1.0.0

# Deploy only user-service
git tag user-service-v1.2.0

# Deploy only messaging-service
git tag messaging-service-v2.0.0
```

#### Multi-Platform Docker Builds
```yaml
platforms: linux/amd64,linux/arm64
```
- Builds for both AMD64 (Intel/AMD) and ARM64 (Apple Silicon, AWS Graviton)
- Uses Docker Buildx
- Pushes to Docker Hub or GHCR

#### Environment-Specific Deployment
- Manual workflow dispatch allows choosing:
  - **Service**: Individual service or all
  - **Environment**: Staging or production
- Environment protection rules can be configured in GitHub

**Registry Options**:

Docker Hub:
```yaml
${{ secrets.DOCKERHUB_USERNAME }}/pulse-user-service:v1.0.0
```

GitHub Container Registry:
```yaml
ghcr.io/${{ github.repository_owner }}/pulse-user-service:v1.0.0
```

---

### 3. PR Validation Workflow (pr-validation.yml)

**Purpose**: Ensure pull requests meet quality standards

**Triggers**:
- PR opened, synchronized, or reopened

**Validation Checks**:

#### 1. Semantic PR Titles
```
✅ feat(user-service): add password reset
✅ fix(messaging-service): resolve connection leak
✅ docs: update API documentation
❌ Updated some stuff
```

#### 2. Merge Conflict Detection
- Automatically checks for conflicts with base branch
- Fails if conflicts detected

#### 3. File Structure Validation
- Prevents committing `.env` files (should be `.env.example`)
- Blocks large files (>10MB)
- Checks for common security issues

#### 4. PR Size Analysis
```
📊 PR Statistics:
  Lines added: 247
  Lines deleted: 89
  Total changes: 336
  ✅ PR size looks good
```
- Warns if PR is too large (>1000 lines)
- Encourages smaller, focused PRs

#### 5. Security Scanning
- **npm audit** for Node.js dependencies
- **Gosec** for Go security issues
- **Trivy** for container vulnerabilities
- Results uploaded to GitHub Security tab

#### 6. Commit Message Linting
- Uses commitlint with conventional commit format
- Enforces consistent commit history

#### 7. Automated PR Comments
- Posts summary comment on PR
- Updates automatically on each push
- Shows status of all validation checks

---

### 4. Code Quality Workflow (code-quality.yml)

**Purpose**: Continuous code quality monitoring

**Triggers**:
- Push to main/develop
- Pull requests
- Weekly schedule (Mondays at 9 AM UTC)

**Quality Checks**:

#### SonarCloud Analysis (Node.js)
- Code smells and bugs
- Security vulnerabilities
- Code coverage tracking
- Technical debt metrics

#### Go Code Metrics
- **Cyclomatic Complexity**: Flags functions with complexity > 15
- **Misspelling**: Catches typos in code
- **Import Formatting**: Ensures consistent imports

#### CodeQL Analysis
- Advanced security scanning
- Finds security vulnerabilities
- Supports both JavaScript and Go
- Results in Security tab

#### Dependency Review
- Checks for vulnerable dependencies
- Fails on moderate+ severity issues
- Blocks GPL-licensed dependencies

---

## 📦 Dependabot Configuration

**File**: `.github/dependabot.yml`

**What it does**:
- Automatically creates PRs for dependency updates
- Separate configuration for each service
- Weekly schedule on Mondays
- Ignores major version updates by default

**Manages**:
- npm packages (Node.js services)
- Go modules (Go services)
- Docker base images
- GitHub Actions versions

**Example PR**:
```
chore(user-service): bump express from 4.18.2 to 4.18.3
```

---

## 🔧 Setup Instructions

### 1. Enable GitHub Actions

1. Go to repository **Settings**
2. Navigate to **Actions** → **General**
3. Enable "Allow all actions and reusable workflows"
4. Set workflow permissions to "Read and write permissions"
5. Check "Allow GitHub Actions to create and approve pull requests"

### 2. Configure Repository Secrets

#### Required for Deployment:
```
Settings → Secrets and variables → Actions → New repository secret
```

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `DOCKERHUB_USERNAME` | Docker Hub username | Deployment |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Deployment |

#### Optional Secrets:
| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `SONAR_TOKEN` | SonarCloud token | Code quality |
| `CODECOV_TOKEN` | Codecov token | Coverage (private repos) |
| `KUBE_CONFIG` | Kubernetes config | K8s deployment |
| `SLACK_WEBHOOK` | Slack notifications | Notifications |

### 3. Generate Docker Hub Token

```bash
# Login to Docker Hub
# Go to Account Settings → Security → New Access Token
# Name: github-actions
# Permissions: Read, Write, Delete
```

### 4. Enable Branch Protection

```
Settings → Branches → Add rule
```

Recommended rules for `main` branch:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass
  - test-node-services
  - test-go-services
  - validate-pr
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Include administrators

---

## 📈 Matrix Strategy Benefits

### Time Savings
```
Traditional Sequential Approach:
├─ user-service (Node 18): 5 min
├─ user-service (Node 20): 5 min
├─ social-service (Node 18): 5 min
├─ social-service (Node 20): 5 min
├─ messaging-service (Go 1.21): 5 min
├─ messaging-service (Go 1.22): 5 min
├─ post-service (Go 1.21): 5 min
└─ post-service (Go 1.22): 5 min
Total: 40 minutes

Matrix Parallel Approach:
├─ All services, all versions (parallel)
Total: 10 minutes
```

### Resource Efficiency
- Shared runner infrastructure
- Dependency caching per service
- Docker layer caching
- Test result reuse

### Scalability
Adding a new service requires only:
```yaml
# Add to change detection
new-service:
  - 'new-service/**'

# Add to matrix
matrix:
  service: [..., new-service]
```

---

## 🎯 Usage Examples

### Running Tests Locally

Before pushing, test locally:

```bash
# Node.js services
cd user-service
npm install
npm run lint
npm run test:coverage

# Go services
cd messaging-service
go mod download
go fmt ./...
go vet ./...
go test ./... -race -cover
```

### Deploying a Service

#### Deploy All Services
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

#### Deploy Specific Service
```bash
git tag -a user-service-v1.2.0 -m "User service: Add password reset"
git push origin user-service-v1.2.0
```

#### Manual Deployment
1. Go to **Actions** tab
2. Select **Deploy Microservices**
3. Click **Run workflow**
4. Choose:
   - Branch: main
   - Service: user-service
   - Environment: production
5. Click **Run workflow**

### Creating a PR

```bash
# Create feature branch
git checkout -b feat/user-service-password-reset

# Make changes
# Commit with conventional format
git commit -m "feat(user-service): add password reset functionality"

# Push and create PR
git push origin feat/user-service-password-reset
```

PR title should follow format:
```
type(scope): description

Examples:
feat(user-service): add password reset
fix(messaging-service): resolve WebSocket connection leak
docs: update API documentation
refactor(post-service): optimize database queries
```

### Viewing Results

#### CI Results
```
Actions → CI → Latest run
├─ detect-changes
├─ test-node-services
│  ├─ user-service (Node 18.x)
│  ├─ user-service (Node 20.x)
│  ├─ social-service (Node 18.x)
│  └─ social-service (Node 20.x)
├─ test-go-services
│  ├─ messaging-service (Go 1.21)
│  ├─ messaging-service (Go 1.22)
│  ├─ post-service (Go 1.21)
│  └─ post-service (Go 1.22)
└─ build-docker-images
   ├─ user-service
   ├─ social-service
   ├─ messaging-service
   └─ post-service
```

#### Coverage Reports
- Codecov dashboard shows coverage per service
- Trend analysis over time
- Coverage diffs on PRs

#### Security Findings
```
Security → Code scanning alerts
```

---

## 🔍 Troubleshooting

### Tests Pass Locally but Fail in CI

**Problem**: Environment differences

**Solutions**:
1. Check service container versions match local
2. Verify environment variables are set
3. Check database initialization scripts
4. Review service health checks

```yaml
# Ensure service is ready
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

### Docker Build Failures

**Problem**: Build context issues

**Solutions**:
1. Check `.dockerignore` file
2. Verify all dependencies are in package files
3. Test build locally:
```bash
cd user-service
docker build -t test .
```

### Matrix Job Failing for Specific Version

**Problem**: Version-specific incompatibility

**Solutions**:
1. Check dependencies support that version
2. Review breaking changes in runtime
3. Temporarily exclude problematic version:
```yaml
matrix:
  node-version: [18.x, 20.x]
  exclude:
    - node-version: 20.x
      service: legacy-service
```

### Slow CI Runs

**Problem**: Cache not working

**Solutions**:
1. Verify cache keys are correct:
```yaml
cache: 'npm'
cache-dependency-path: ${{ matrix.service }}/package-lock.json
```

2. Clear cache and retry:
```
Settings → Actions → Caches → Delete old caches
```

### Security Scan False Positives

**Problem**: Known issues flagged

**Solutions**:
1. Document in code:
```javascript
// nosemgrep: javascript.lang.security.audit.path-traversal
```

2. Configure tool to ignore:
```yaml
# .trivyignore
CVE-2021-12345
```

---

## 📚 Best Practices

### 1. Commit Messages
```bash
# Good
feat(user-service): add email verification
fix(messaging-service): resolve memory leak
docs: update API documentation

# Bad
updated code
fixed bug
WIP
```

### 2. PR Size
- Keep PRs under 500 lines when possible
- Focus on single feature or fix
- Break large features into multiple PRs

### 3. Testing
- Write tests for new features
- Maintain >80% code coverage
- Test edge cases and error handling

### 4. Security
- Never commit secrets or credentials
- Use environment variables for config
- Keep dependencies updated
- Review security scan results

### 5. Performance
- Use caching aggressively
- Leverage matrix parallelization
- Skip unnecessary jobs with conditions

---

## 🔗 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Matrix Strategy](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)

---

## 📞 Support

For issues or questions:
1. Check workflow logs in Actions tab
2. Review this guide
3. Check individual workflow README files
4. Create an issue in the repository

---

**Last Updated**: October 2025

