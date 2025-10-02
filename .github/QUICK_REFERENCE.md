# GitHub Actions Quick Reference

## 🚀 Quick Commands

### Deploy Services
```bash
# Deploy all services
git tag -a v1.0.0 -m "Release v1.0.0" && git push origin v1.0.0

# Deploy specific service
git tag -a user-service-v1.0.0 -m "User service v1.0.0" && git push origin user-service-v1.0.0
```

### Create a PR
```bash
# Branch naming
feat/service-name-feature-description
fix/service-name-bug-description

# Commit format
git commit -m "type(scope): description"

# Examples
git commit -m "feat(user-service): add password reset"
git commit -m "fix(messaging-service): resolve connection leak"
```

## 📋 Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(user-service): add 2FA` |
| `fix` | Bug fix | `fix(post-service): resolve query timeout` |
| `docs` | Documentation | `docs: update API guide` |
| `refactor` | Code refactoring | `refactor(messaging-service): optimize handler` |
| `test` | Tests | `test(social-service): add follow tests` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `ci` | CI/CD changes | `ci: add security scan` |

## 🎯 Scopes

- `user-service`
- `social-service`
- `messaging-service`
- `post-service`
- `infra`
- `docs`
- `deps`
- `docker`
- `ci`

## 🔍 Check Status

### View All Workflows
```
Repository → Actions tab
```

### Check Specific Service
```
Actions → CI → Filter by service name
```

### View Coverage
```
Codecov dashboard (if configured)
```

### Security Alerts
```
Security tab → Code scanning alerts
```

## ⚙️ Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI | Push to main/develop, PRs | Run tests |
| Deploy | Version tags, manual | Deploy to production |
| PR Validation | PR opened/updated | Validate PR quality |
| Code Quality | Push, PR, weekly | Quality checks |

## 🔐 Required Secrets

### For Deployment (Required)
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

### Optional
- `SONAR_TOKEN` - Code quality
- `CODECOV_TOKEN` - Coverage
- `SLACK_WEBHOOK` - Notifications

## 📊 Matrix Coverage

### Node.js Services
- **Versions**: 18.x, 20.x
- **Services**: user-service, social-service

### Go Services
- **Versions**: 1.21, 1.22
- **Services**: messaging-service, post-service

## ✅ PR Checklist

Before submitting a PR:

- [ ] Commit messages follow convention
- [ ] PR title is semantic (type(scope): description)
- [ ] Tests pass locally
- [ ] No large files committed
- [ ] No `.env` files (use `.env.example`)
- [ ] Code is linted
- [ ] Documentation updated if needed
- [ ] PR is reasonably sized (<500 lines preferred)

## 🐛 Common Issues

### Tests fail in CI but pass locally
```bash
# Check environment variables
# Verify service versions match
# Review workflow logs
```

### Docker build fails
```bash
# Test locally
cd service-name
docker build -t test .
```

### Coverage not uploading
```bash
# Check Codecov token is set
# Verify coverage file path
```

## 📖 Full Documentation

- [Comprehensive Guide](../GITHUB_ACTIONS_GUIDE.md)
- [Workflow Details](.github/workflows/README.md)
- [Service Guide](../docs/SERVICE_GUIDE.md)

## 🎓 Learning Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Matrix Strategy](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)

---

💡 **Pro Tip**: Add this to your IDE as a snippet or bookmark for quick access!

