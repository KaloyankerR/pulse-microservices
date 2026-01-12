# ArgoCD Setup and Usage

This guide covers ArgoCD installation, configuration, and GitOps workflows for the Pulse microservices platform on Minikube.

## Overview

ArgoCD is a declarative, GitOps continuous delivery tool for Kubernetes. It automatically syncs applications defined in Git repositories to target Kubernetes clusters.

**Key Features:**
- GitOps-based deployments
- Automatic sync from Git repository
- Web UI for visualization and management
- CLI for automation
- Multi-cluster support
- Application health monitoring

## Installation

### Prerequisites

- Minikube cluster running
- `kubectl` configured to access the cluster
- Sufficient cluster resources (ArgoCD requires ~512MB RAM minimum)

### Quick Install

**Option 1: Install Separately (Recommended)**
```bash
# Start cluster first
make k8s-start

# Then install ArgoCD
make k8s-argocd-install
```

**Option 2: Install Together with Cluster**
```bash
# Start cluster and install ArgoCD in one command
make k8s-start-with-argocd
```

The install command:
1. Verifies cluster connection
2. Creates the `argocd` namespace
3. Installs ArgoCD using official manifests
4. Waits for ArgoCD server to be ready

### Verify Installation

```bash
kubectl get pods -n argocd
```

You should see several pods running:
- `argocd-server` - Web UI and API server
- `argocd-repo-server` - Repository server
- `argocd-application-controller` - Application controller
- `argocd-applicationset-controller` - ApplicationSet controller
- `argocd-notifications-controller` - Notifications controller
- `argocd-redis` - Redis cache

## Accessing ArgoCD

### Web UI (Recommended)

1. **Start port-forwarding:**
   ```bash
   make k8s-argocd-port-forward
   ```

2. **Get admin password:**
   ```bash
   make k8s-argocd-get-password
   ```

3. **Access the UI:**
   - URL: http://localhost:8080
   - Username: `admin`
   - Password: (from step 2)

### CLI Access (Optional)

1. **Install ArgoCD CLI:**
   ```bash
   # macOS
   brew install argocd
   
   # Linux
   curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
   chmod +x /usr/local/bin/argocd
   ```

2. **Login:**
   ```bash
   # Port-forward must be running first
   argocd login localhost:8080
   # Username: admin
   # Password: (run make k8s-argocd-get-password)
   ```

3. **Verify:**
   ```bash
   argocd app list
   ```

## Configuration

### Application Setup

The ArgoCD Application manifest (`pulse-app.yaml`) defines how ArgoCD manages the Pulse microservices.

**Current Configuration:**
- **Application Name**: `pulse-microservices`
- **Source Repository**: (needs to be configured)
- **Source Path**: `k8s/`
- **Destination Namespace**: `pulse`
- **Sync Policy**: Automated with prune and self-heal

### Configuring Git Repository

1. **Update the repository URL in `pulse-app.yaml`:**
   ```yaml
   spec:
     source:
       repoURL: https://github.com/YOUR_USERNAME/pulse-microservices.git
       targetRevision: HEAD  # or specific branch/tag
       path: k8s
   ```

2. **For private repositories**, you'll need to add repository credentials in ArgoCD:
   ```bash
   argocd repo add https://github.com/YOUR_USERNAME/pulse-microservices.git \
     --username YOUR_USERNAME \
     --password YOUR_TOKEN
   ```
   
   Or via UI: Settings → Repositories → Connect Repo

3. **Create the application:**
   ```bash
   make k8s-argocd-create-app
   ```

### Sync Policies

**Automated Sync (Recommended for GitOps):**
- Automatically syncs when changes are detected in Git
- Enables `prune` to remove resources deleted from Git
- Enables `selfHeal` to revert manual changes to match Git state

**Manual Sync:**
- Disable `automated` in sync policy
- Sync manually via UI or CLI

## GitOps Workflow

### Standard GitOps Flow

1. **Make Changes**: Edit Kubernetes manifests in the `k8s/` directory
2. **Commit to Git**: Push changes to your Git repository
3. **Auto-Sync**: ArgoCD detects changes and automatically syncs to cluster
4. **Monitor**: Watch deployment status in ArgoCD UI

### Manual Sync Flow

1. **Make Changes**: Edit Kubernetes manifests
2. **Commit to Git**: Push changes to repository
3. **Trigger Sync**: Use ArgoCD UI "Sync" button or CLI:
   ```bash
   argocd app sync pulse-microservices
   ```

### Rollback

If a deployment fails or needs to be rolled back:

**Via UI:**
1. Open the application in ArgoCD UI
2. Click "History" tab
3. Select the previous successful sync
4. Click "Sync" to rollback

**Via CLI:**
```bash
argocd app rollback pulse-microservices <REVISION>
```

## Common Operations

### View Application Status

**Via UI:**
- Open ArgoCD UI → Applications → pulse-microservices
- View health status, sync status, and resource tree

**Via CLI:**
```bash
argocd app get pulse-microservices
argocd app list
```

### Sync Application

**Via UI:**
- Open application → Click "Sync" button
- Select resources to sync → Click "Synchronize"

**Via CLI:**
```bash
argocd app sync pulse-microservices
```

### Refresh Application

Force ArgoCD to check Git repository for changes:

**Via CLI:**
```bash
argocd app get pulse-microservices --refresh
```

Or enable auto-refresh in UI: Application → App Details → Auto-refresh

### View Application Logs

```bash
# Application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller -f

# Repository server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-repo-server -f
```

### Delete Application

**Via UI:**
- Open application → Settings → Delete

**Via CLI:**
```bash
argocd app delete pulse-microservices
```

**Note**: This removes the ArgoCD Application, but resources in the cluster remain unless you enable cascade delete.

## Troubleshooting

### ArgoCD Server Not Starting

```bash
# Check pod status
kubectl get pods -n argocd

# Check logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server

# Check events
kubectl describe pod -n argocd -l app.kubernetes.io/name=argocd-server
```

**Common Issues:**
- Insufficient cluster resources (increase Minikube memory/CPU)
- Image pull errors (check network connectivity)

### Application Out of Sync

**Symptoms:** Application shows "OutOfSync" status

**Solutions:**
1. Check if Git repository is accessible
2. Verify repository credentials are correct
3. Check application logs for errors
4. Manually sync: `argocd app sync pulse-microservices`

### Authentication Issues

**Cannot login to UI:**
- Verify port-forward is running
- Check password with `make k8s-argocd-get-password`
- Password is stored in Secret: `argocd-initial-admin-secret`

**Change admin password:**
```bash
argocd account update-password
```

### Repository Connection Issues

**Private repository authentication:**
- Add repository credentials in ArgoCD
- Use SSH keys or HTTPS tokens
- Configure via UI: Settings → Repositories

**Certificate issues:**
- For self-signed certificates, configure `insecure: true` in repository settings
- Or add CA certificate to ArgoCD

### Sync Failures

**Check sync history:**
```bash
argocd app history pulse-microservices
```

**Common causes:**
- Resource conflicts (resources modified outside Git)
- Invalid manifests in Git
- Cluster resource constraints
- Network issues

**Debug:**
- Check application events in UI
- Review application controller logs
- Verify manifests are valid YAML

## Advanced Configuration

### Custom Sync Windows

Configure sync windows to prevent syncs during specific times:

```yaml
spec:
  syncPolicy:
    syncWindows:
      - kind: allow
        schedule: '10 1 * * *'
        duration: 2h
        applications:
          - '*'
```

### Resource Hooks

Add resource hooks for lifecycle management:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
```

### Health Checks

Customize health checks for specific resources:

```yaml
spec:
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
```

## Uninstallation

To remove ArgoCD:

```bash
make k8s-argocd-uninstall
```

This deletes the `argocd` namespace and all ArgoCD resources. Applications managed by ArgoCD remain in the cluster unless explicitly deleted.

## Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [ArgoCD GitHub](https://github.com/argoproj/argo-cd)
- [GitOps Principles](https://www.gitops.tech/)
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)

## Makefile Commands Summary

```bash
# Installation
make k8s-argocd-install          # Install ArgoCD

# Access
make k8s-argocd-port-forward     # Port-forward UI (http://localhost:8080)
make k8s-argocd-get-password     # Get admin password

# Management
make k8s-argocd-create-app       # Create Pulse application
make k8s-argocd-uninstall        # Uninstall ArgoCD
```
