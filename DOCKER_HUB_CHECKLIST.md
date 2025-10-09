# Docker Hub Deployment - Setup Checklist

Use this checklist to set up Docker Hub deployment for the Pulse microservices platform.

## Prerequisites Checklist

- [ ] Docker Hub account created
- [ ] GitHub repository with admin access
- [ ] Local Docker installed and running
- [ ] Git installed and configured

## 1. Docker Hub Setup

### Create Docker Hub Account
- [ ] Sign up at https://hub.docker.com
- [ ] Verify email address
- [ ] Log in to Docker Hub

### Create Access Token
- [ ] Navigate to Account Settings → Security
- [ ] Click "New Access Token"
- [ ] Name: `github-actions-pulse-microservices`
- [ ] Permissions: **Read, Write, Delete**
- [ ] Copy and save the token securely (shown only once!)

### Create Repositories (Optional)
Docker Hub can auto-create repositories, but you can create them manually:

- [ ] `pulse-user-service`
- [ ] `pulse-social-service`
- [ ] `pulse-messaging-service`
- [ ] `pulse-post-service`
- [ ] `pulse-notification-service`

**Note**: Set repositories to Public or Private based on your needs

## 2. GitHub Secrets Configuration

### Add Required Secrets
Navigate to: Repository Settings → Secrets and variables → Actions

- [ ] Click "New repository secret"
- [ ] Add `DOCKERHUB_USERNAME`
  - Name: `DOCKERHUB_USERNAME`
  - Secret: Your Docker Hub username (e.g., `johndoe`)
- [ ] Add `DOCKERHUB_TOKEN`
  - Name: `DOCKERHUB_TOKEN`
  - Secret: The access token from step 1

### Verify Secrets
- [ ] Both secrets appear in the list
- [ ] Secret names are exactly as specified (case-sensitive)

## 3. GitHub Actions Configuration

### Enable GitHub Actions
- [ ] Go to Settings → Actions → General
- [ ] Select "Allow all actions and reusable workflows"
- [ ] Set Workflow permissions to "Read and write permissions"
- [ ] Enable "Allow GitHub Actions to create and approve pull requests" (optional)
- [ ] Save changes

### Verify Workflow Files
Ensure these files exist in your repository:

- [ ] `.github/workflows/microservices-ci.yml`
- [ ] `.github/workflows/docker-deploy.yml`

## 4. Test Deployment

### Test CI Workflow
- [ ] Create a test branch: `git checkout -b test/docker-deployment`
- [ ] Make a minor change (e.g., update README)
- [ ] Commit: `git commit -m "test: Docker Hub deployment"`
- [ ] Push: `git push origin test/docker-deployment`
- [ ] Create Pull Request
- [ ] Verify CI workflow runs (check Actions tab)
- [ ] Verify tests pass
- [ ] Verify Docker images build successfully
- [ ] Verify no push to Docker Hub (PR only tests)

### Test Automatic Deployment
- [ ] Merge PR to main
- [ ] Go to Actions tab
- [ ] Watch "Microservices CI" workflow
- [ ] Verify all tests pass
- [ ] Verify Docker images are pushed to Docker Hub
- [ ] Check Docker Hub for new images

### Verify Images on Docker Hub
- [ ] Go to https://hub.docker.com/r/yourusername/pulse-user-service
- [ ] Verify `latest` tag exists
- [ ] Verify commit SHA tag exists
- [ ] Check image size and platforms
- [ ] Verify last updated time

### Test Image Pull
- [ ] Open terminal
- [ ] Run: `docker pull yourusername/pulse-user-service:latest`
- [ ] Verify image downloads successfully
- [ ] Run: `docker images | grep pulse`
- [ ] Verify all services are listed

## 5. Version Release Test

### Create Version Tag
- [ ] Ensure main branch is up to date: `git checkout main && git pull`
- [ ] Create version tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`

### Verify Deployment
- [ ] Go to Actions tab
- [ ] Find "Deploy to Docker Hub" workflow
- [ ] Verify it's running
- [ ] Wait for completion
- [ ] Check deployment summary

### Check Docker Hub
- [ ] Verify all services have version tag `1.0.0`
- [ ] Verify `latest` tags are updated
- [ ] Check multi-platform support (AMD64, ARM64)
- [ ] Verify timestamps match deployment time

## 6. Manual Deployment Test

### Trigger Manual Workflow
- [ ] Go to Actions tab
- [ ] Select "Deploy to Docker Hub"
- [ ] Click "Run workflow"
- [ ] Select:
  - Branch: `main`
  - Service: `user-service`
  - Environment: `staging`
- [ ] Click "Run workflow"

### Verify Deployment
- [ ] Watch workflow execution
- [ ] Verify build succeeds
- [ ] Verify push succeeds
- [ ] Check deployment summary
- [ ] Verify image on Docker Hub

## 7. Local Testing

### Pull and Run Images
- [ ] Create `.env` file: `cp env.dockerhub.example .env`
- [ ] Edit `.env` with your Docker Hub username
- [ ] Update `docker-compose.dockerhub.yml` with your username
- [ ] Pull images: `docker-compose -f docker-compose.dockerhub.yml pull`
- [ ] Start services: `docker-compose -f docker-compose.dockerhub.yml up -d`

### Verify Services
- [ ] Check service status: `docker-compose -f docker-compose.dockerhub.yml ps`
- [ ] Test health endpoint: `curl http://localhost:8000/health`
- [ ] Test user service: `curl http://localhost:8081/health`
- [ ] Test other services: `curl http://localhost:8082/health` etc.
- [ ] Check logs: `docker-compose -f docker-compose.dockerhub.yml logs`

## 8. Documentation Review

### Read Documentation
- [ ] Review [DOCKER_HUB_DEPLOYMENT.md](docs/DOCKER_HUB_DEPLOYMENT.md)
- [ ] Review [DOCKER_HUB_QUICKSTART.md](DOCKER_HUB_QUICKSTART.md)
- [ ] Review [DEPLOYMENT_WORKFLOWS.md](docs/DEPLOYMENT_WORKFLOWS.md)
- [ ] Review [DOCKER_HUB_SETUP_SUMMARY.md](docs/DOCKER_HUB_SETUP_SUMMARY.md)

### Update Project Documentation
- [ ] Update main README.md with your Docker Hub username
- [ ] Update team wiki or internal docs
- [ ] Share deployment guide with team

## 9. Production Preparation

### Security
- [ ] Rotate Docker Hub access token
- [ ] Enable 2FA on Docker Hub account
- [ ] Review repository visibility (Public/Private)
- [ ] Consider private repositories for sensitive services
- [ ] Set up image scanning (optional)

### Performance
- [ ] Review image sizes
- [ ] Optimize Dockerfiles if needed
- [ ] Set up Docker Hub image retention policy
- [ ] Consider CDN for image distribution (enterprise)

### Monitoring
- [ ] Set up Docker Hub webhooks (optional)
- [ ] Configure Slack/Discord notifications (optional)
- [ ] Set up automated image scanning (optional)
- [ ] Review GitHub Actions usage and limits

## 10. Team Onboarding

### Share with Team
- [ ] Send documentation links to team
- [ ] Schedule walkthrough session (optional)
- [ ] Create internal deployment runbook
- [ ] Add deployment info to team wiki

### Set Up Team Access
- [ ] Add team members to Docker Hub organization (if applicable)
- [ ] Configure branch protection rules
- [ ] Set up required reviews for production tags
- [ ] Document emergency rollback procedures

## 11. Ongoing Maintenance

### Regular Tasks
- [ ] Monitor GitHub Actions usage
- [ ] Review Docker Hub storage usage
- [ ] Clean up old images periodically
- [ ] Update dependencies in Dockerfiles
- [ ] Rotate secrets quarterly

### Best Practices
- [ ] Use semantic versioning for releases
- [ ] Tag production releases after testing
- [ ] Keep `latest` tag stable
- [ ] Document breaking changes
- [ ] Maintain changelog

## Troubleshooting Checklist

If deployment fails, check:

- [ ] GitHub Secrets are set correctly
- [ ] Docker Hub token has write permissions
- [ ] Repository names match expected format
- [ ] Docker Hub repositories exist (or auto-create is enabled)
- [ ] Workflow YAML syntax is valid
- [ ] No network connectivity issues
- [ ] Docker Hub service status (status.docker.com)
- [ ] GitHub Actions service status

## Success Criteria

You've successfully set up Docker Hub deployment when:

- ✅ CI workflow runs on every PR
- ✅ Images are pushed to Docker Hub on main branch
- ✅ Version tags trigger multi-platform builds
- ✅ Images can be pulled and run locally
- ✅ All services are accessible and healthy
- ✅ Team can deploy manually when needed
- ✅ Documentation is complete and shared

## Next Steps

After completing this checklist:

1. **Production Deployment**
   - Plan production rollout
   - Set up staging environment
   - Test with production-like load

2. **Advanced Features**
   - Set up image signing
   - Add security scanning
   - Configure Kubernetes deployment
   - Set up automated rollbacks

3. **Optimization**
   - Profile image sizes
   - Optimize build times
   - Implement caching strategies
   - Consider multi-stage builds

## Support

Need help?
- 📖 Check [docs/DOCKER_HUB_DEPLOYMENT.md](docs/DOCKER_HUB_DEPLOYMENT.md)
- 🐛 Review GitHub Actions logs
- 💬 Open GitHub issue with `deployment` label
- 🔍 Search Docker Hub documentation

---

**Checklist Version**: 1.0.0
**Last Updated**: 2025-10-09
**Maintainer**: DevOps Team

