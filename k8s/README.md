# Kubernetes Deployment Guide

Quick reference guide for deploying Pulse microservices on Kubernetes (Minikube).

## Prerequisites

- **Minikube** - Local Kubernetes cluster
- **kubectl** - Kubernetes command-line tool
- **Docker** - Container runtime
- **Make** - Build automation tool

## Quick Start

### Step-by-Step Deployment

1. **Start Minikube Cluster**
   ```bash
   make k8s-start
   ```
   Starts Minikube with 4GB RAM, 2 CPUs, and enables required addons (ingress, storage).

2. **Build Docker Images**
   ```bash
   make k8s-build
   ```
   Builds all service images and makes them available in Minikube's Docker daemon.

3. **Deploy All Services**
   ```bash
   make k8s-deploy
   ```
   Deploys databases, microservices, gateway, frontend, and monitoring stack.

4. **Check Deployment Status**
   ```bash
   make k8s-status
   ```
   Verify all pods are running (wait 2-3 minutes for full startup).

5. **Access Services**
   ```bash
   make k8s-port-forward
   ```
   Sets up port-forwarding for frontend, gateway, and messaging service.

## Commands Reference

### Cluster Management

- `make k8s-start` - Start Minikube cluster with Kubernetes v1.30.0 and required addons
- `make k8s-stop` - Stop Minikube cluster

### Docker Build

- `make k8s-build` - Build all Docker images (auth, user, post, social, messaging, notification, event, frontend)
- `make k8s-clean` - Clean up Docker images and Minikube storage

### Deployment

- `make k8s-deploy` - Deploy all services, databases, gateway, frontend, and monitoring
- `make k8s-delete` - Delete all Kubernetes resources and namespace

### Access & Monitoring

- `make k8s-port-forward` - Port forward frontend (3000), Kong (8000/8001), messaging (8084)
- `make k8s-status` - Show status of all pods in pulse namespace
- `make k8s-logs-<service>` - View logs for a specific service (e.g., `make k8s-logs-auth-service`)

## Database Initialization

Database schemas are automatically initialized during deployment. If needed, manually run:

**Prisma Services (auth, user, social):**
```bash
kubectl exec -n pulse deployment/auth-service -- npx prisma db push --skip-generate
kubectl exec -n pulse deployment/user-service -- npx prisma db push --skip-generate
kubectl exec -n pulse deployment/social-service -- npx prisma db push --skip-generate
```

**Post Service:**
```bash
cat post-service/init.sql | kubectl exec -i -n pulse $(kubectl get pods -n pulse -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U pulse_user -d pulse_posts
```

**MongoDB Services:** Collections are auto-created on first use (no manual setup needed).

## Access URLs

After running `make k8s-port-forward`, access services at:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Kong Admin**: http://localhost:8001
- **WebSocket**: ws://localhost:8084/ws

**Optional (manual port-forward):**
- **Prometheus**: `kubectl port-forward -n pulse service/prometheus 9090:9090 &`
- **Grafana**: `kubectl port-forward -n pulse service/grafana 3001:3000 &`

## Complete Workflow

**First Time Setup:**
```bash
make k8s-start      # 1. Start cluster
make k8s-build      # 2. Build images
make k8s-deploy     # 3. Deploy everything
make k8s-status     # 4. Check status
make k8s-port-forward  # 5. Access services
```

**Clean Rebuild:**
```bash
make k8s-stop && pkill -f "kubectl port-forward"  # Stop everything
make k8s-clean      # Clean images
make k8s-build      # Rebuild
make k8s-start      # Start cluster
make k8s-deploy     # Deploy
make k8s-port-forward  # Access
```

## Troubleshooting

**Pods not starting:** Check logs with `make k8s-logs-<service>` or `kubectl describe pod <pod-name> -n pulse`

**Port-forward not working:** Kill existing forwards with `pkill -f "kubectl port-forward"` then restart

**Database connection errors:** Verify database pods are running with `kubectl get pods -n pulse | grep -E "postgres|mongodb"`

