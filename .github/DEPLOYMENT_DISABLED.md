# Deployment Workflow Status

## 🚫 Deployment is Currently DISABLED

The deployment workflow (`.github/workflows/deploy.yml`) has been disabled and will not run automatically.

### What's Disabled

- ❌ Automatic deployment on version tags
- ❌ Manual deployment via workflow dispatch
- ❌ Service-specific tag deployments

### What Still Works

- ✅ CI/CD testing (all services)
- ✅ PR validation
- ✅ Code quality checks
- ✅ Docker image builds (validation only, no push)

## 📋 Current Status

| Workflow | Status | Runs On |
|----------|--------|---------|
| CI | ✅ Active | Push, PR |
| PR Validation | ✅ Active | PR events |
| Code Quality | ✅ Active | Push, PR, Weekly |
| **Deploy** | ❌ **DISABLED** | *None* |

## 🔧 How to Re-enable Deployment

When you're ready to enable deployments:

### Step 1: Edit the Workflow File

Open `.github/workflows/deploy.yml` and find this section at the top:

```yaml
# Deployment workflow is currently disabled
# To re-enable, uncomment the 'on:' section below

# on:
#   push:
#     tags:
#       - 'v*.*.*'
#       - 'user-service-v*.*.*'
#       - 'social-service-v*.*.*'
#       - 'messaging-service-v*.*.*'
#       - 'post-service-v*.*.*'
#   workflow_dispatch:
#     inputs:
#       service:
#         description: 'Service to deploy'
#         required: true
#         type: choice
#         options:
#           - all
#           - user-service
#           - social-service
#           - messaging-service
#           - post-service
#       environment:
#         description: 'Deployment environment'
#         required: true
#         type: choice
#         options:
#           - staging
#           - production
```

### Step 2: Uncomment the Triggers

Remove the `#` from all the lines to uncomment them.

### Step 3: Remove Temporary Trigger

Delete or comment out this temporary section:

```yaml
on:
  workflow_dispatch:
    inputs:
      confirm_enable:
        description: 'Type "ENABLE" to manually trigger this disabled workflow'
        required: true
        type: string
```

### Step 4: Update Job Conditions

Remove the condition from the first job:

```yaml
jobs:
  determine-services:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm_enable == 'ENABLE'  # ← Remove this line
```

And remove the warning step:

```yaml
- name: Warning - Deployment is disabled  # ← Remove this entire step
  run: |
    echo "⚠️  WARNING: This deployment workflow is currently disabled!"
    echo "This workflow should only run for testing purposes."
    echo "To fully enable, update the 'on:' triggers in deploy.yml"
```

### Step 5: Configure Secrets

Make sure you have these secrets configured:

```
Repository Settings → Secrets → Actions:
- DOCKERHUB_USERNAME
- DOCKERHUB_TOKEN
```

### Step 6: Commit and Push

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: enable deployment workflow"
git push origin main
```

### Step 7: Test

Create a test tag to verify it works:

```bash
git tag -a test-v0.0.1 -m "Test deployment"
git push origin test-v0.0.1
```

## 🎯 Quick Enable Script

If you want to quickly enable deployment, you can run:

```bash
# This will create a new branch with deployment enabled
git checkout -b enable-deployment

# Make the edits (you'll need to do this manually)
# Then:
git add .github/workflows/deploy.yml
git commit -m "ci: enable deployment workflow"
git push origin enable-deployment

# Create PR and merge
```

## 📝 Why Was It Disabled?

Deployment workflows are disabled by default to prevent:

1. ❌ Accidental deployments before infrastructure is ready
2. ❌ Pushing to registries without proper authentication
3. ❌ Deploying to production without proper testing
4. ❌ Wasting GitHub Actions minutes on failed deployments

## ✅ Checklist Before Enabling

Before re-enabling deployment, ensure:

- [ ] Docker Hub account is created (or GHCR is configured)
- [ ] `DOCKERHUB_USERNAME` secret is set
- [ ] `DOCKERHUB_TOKEN` secret is set
- [ ] You understand the tagging strategy
- [ ] You have a rollback plan
- [ ] You've tested Docker builds locally
- [ ] Infrastructure is ready to receive deployments
- [ ] You've reviewed the deployment workflow

## 🔗 Related Documentation

- [Deployment Workflow Details](.github/workflows/README.md#2-deploy-workflow-deployyml)
- [GitHub Actions Guide](../GITHUB_ACTIONS_GUIDE.md)
- [Quick Reference](QUICK_REFERENCE.md)

---

**Status**: Deployment DISABLED  
**Date**: October 2025  
**To Enable**: Follow steps above

