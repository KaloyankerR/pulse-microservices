# Kubernetes Deployment Guide

Deployment guide for Pulse microservices on Kubernetes - supports both **Minikube (local)** and **DigitalOcean (production)**.

## Prerequisites

- **kubectl** - Kubernetes command-line tool
- **Docker** - Container runtime
- **Make** - Build automation tool
- **Minikube** (for local development) - Local Kubernetes cluster

## Deployment Options

### Local Development (Minikube)

Quick start for local testing:

```bash
make k8s-start      # Start Minikube cluster (4GB RAM, 2 CPUs)
make k8s-build      # Build all Docker images
make k8s-deploy     # Deploy all services
make k8s-status     # Check pod status
make k8s-port-forward  # Access services locally
```

### Production (DigitalOcean)

Connect to DigitalOcean Kubernetes cluster:

```bash
# Set kubeconfig for DigitalOcean cluster
export KUBECONFIG=./pulse-cluster-kubeconfig.yaml

# Verify connection
kubectl cluster-info
kubectl get nodes

# Deploy (same manifests work for both environments)
kubectl apply -f k8s/namespaces/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/databases/
kubectl apply -f k8s/services/
kubectl apply -f k8s/gateway/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/monitoring/
kubectl apply -f k8s/ingress/

# Check status
kubectl get pods -n pulse
```

## Quick Start (Minikube)

1. **Start Cluster**: `make k8s-start`
2. **Build Images**: `make k8s-build`
3. **Deploy**: `make k8s-deploy`
4. **Check Status**: `make k8s-status`
5. **Access Services**: `make k8s-port-forward`

**Optional - ArgoCD (GitOps):**
- Install separately: `make k8s-argocd-install` (after starting cluster)
- Or install together: `make k8s-start-with-argocd`

## Commands Reference

### Cluster Management
- `make k8s-start` - Start Minikube cluster (Kubernetes v1.30.0)
- `make k8s-start-with-argocd` - Start Minikube cluster and install ArgoCD
- `make k8s-stop` - Stop Minikube cluster

### Docker Build
- `make k8s-build` - Build all Docker images
- `make k8s-clean` - Clean up Docker images

### Deployment
- `make k8s-deploy` - Deploy all services, databases, gateway, frontend, monitoring
- `make k8s-delete` - Delete all Kubernetes resources

### Access & Monitoring
- `make k8s-port-forward` - Port forward frontend (3000), Kong (8000/8001), messaging (8084)
- `make k8s-status` - Show status of all pods in pulse namespace
- `make k8s-logs-<service>` - View logs for a specific service

### ArgoCD (GitOps)
- `make k8s-argocd-install` - Install ArgoCD in argocd namespace
- `make k8s-argocd-port-forward` - Port forward ArgoCD UI (http://localhost:8080)
- `make k8s-argocd-get-password` - Get admin password for ArgoCD UI
- `make k8s-argocd-create-app` - Create ArgoCD Application for Pulse microservices
- `make k8s-argocd-uninstall` - Uninstall ArgoCD

## ArgoCD (GitOps)

ArgoCD provides GitOps-based continuous deployment for Kubernetes. It monitors your Git repository and automatically syncs changes to the cluster.

### Quick Start

1. **Install ArgoCD**: `make k8s-argocd-install`
2. **Get Admin Password**: `make k8s-argocd-get-password`
3. **Access UI**: `make k8s-argocd-port-forward` (opens http://localhost:8080)
4. **Create Application**: `make k8s-argocd-create-app` (after configuring repository URL)

### Accessing ArgoCD

**Via Port-Forwarding:**
```bash
make k8s-argocd-port-forward
# Access at http://localhost:8080
# Username: admin
# Password: (run make k8s-argocd-get-password)
```

**Default Credentials:**
- Username: `admin`
- Password: Retrieve via `make k8s-argocd-get-password`

### GitOps Workflow

1. **Configure Repository**: Update `k8s/argocd/pulse-app.yaml` with your Git repository URL
2. **Create Application**: Run `make k8s-argocd-create-app`
3. **Auto-Sync**: ArgoCD will automatically sync changes from the Git repository to the cluster
4. **Manual Sync**: Use the ArgoCD UI or CLI to manually trigger syncs

For detailed ArgoCD documentation, see [k8s/argocd/README.md](argocd/README.md).

## Access URLs (Minikube)

After `make k8s-port-forward`:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Kong Admin**: http://localhost:8001
- **WebSocket**: ws://localhost:8084/ws

After `make k8s-argocd-port-forward`:
- **ArgoCD UI**: http://localhost:8080

## Architecture

**Namespace**: `pulse`

**Components**:
- **7 Microservices**: auth, user, post, event, social, messaging, notification
- **4 Databases**: PostgreSQL (StatefulSet), MongoDB, Redis, RabbitMQ
- **1 Gateway**: Kong API Gateway
- **1 Frontend**: Next.js application
- **Monitoring**: Prometheus + Grafana
- **Ingress**: NGINX Ingress Controller

All services use:
- Health probes (liveness, readiness, startup)
- Resource limits (CPU/memory)
- Persistent storage (databases via PVCs)
- Service discovery (DNS-based)

## Troubleshooting

**Pods not starting**: `kubectl describe pod <pod-name> -n pulse` or `make k8s-logs-<service>`

**Port-forward issues**: `pkill -f "kubectl port-forward"` then restart

**Database errors**: `kubectl get pods -n pulse | grep -E "postgres|mongodb"`
