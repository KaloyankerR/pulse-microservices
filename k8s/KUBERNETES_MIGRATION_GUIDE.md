# Kubernetes Migration Guide for Pulse Microservices

This guide provides step-by-step instructions for migrating the Pulse microservices from Docker Compose to Kubernetes (Minikube).

## Prerequisites

1. **Minikube** installed and configured
2. **kubectl** installed and configured
3. **Docker** installed (for building images)
4. **Make** installed (for using Makefile commands)

## Architecture Overview

The Kubernetes deployment uses:
- **Namespace**: `pulse` (single namespace for all services)
- **PostgreSQL**: StatefulSet with persistent volume (in-cluster)
- **MongoDB, Redis, RabbitMQ**: Deployments with persistent volumes
- **7 Microservices**: Deployments with health checks and resource limits
- **Kong Gateway**: API Gateway with declarative configuration
- **Frontend**: Next.js application
- **Monitoring**: Prometheus, Grafana, Node Exporter, Redis Exporter

## Quick Start

### 1. Start Minikube

```bash
make k8s-start
```

This will:
- Start Minikube with 4GB RAM and 2 CPU cores
- Enable the ingress addon

### 2. Build Docker Images

```bash
make k8s-build
```

This builds all Docker images and makes them available in Minikube's Docker daemon.

### 3. Deploy Everything

```bash
make k8s-deploy-all
```

This performs a full deployment:
1. Creates namespace
2. Deploys databases (PostgreSQL, MongoDB, Redis, RabbitMQ)
3. Initializes PostgreSQL databases
4. Deploys microservices
5. Deploys monitoring stack
6. Deploys Kong Gateway and frontend
7. Creates Ingress resources

## Step-by-Step Deployment

### Step 1: Start Minikube

```bash
make k8s-start
```

Verify Minikube is running:
```bash
minikube status
kubectl get nodes
```

### Step 2: Build and Load Images

```bash
make k8s-build
```

This command:
- Sets up Minikube's Docker environment
- Builds all service images with tag `pulse-<service>:latest`
- Images are automatically available in Minikube

### Step 3: Deploy Databases

```bash
make k8s-deploy-db
```

This deploys:
- PostgreSQL StatefulSet (with PVC)
- MongoDB Deployment (with PVC)
- Redis Deployment (with PVC)
- RabbitMQ Deployment (with PVC)
- Runs database initialization job for PostgreSQL

Wait for databases to be ready:
```bash
kubectl get pods -n pulse
```

### Step 4: Deploy Microservices

```bash
make k8s-deploy-services
```

This deploys all 7 microservices:
- auth-service
- user-service
- post-service
- social-service
- messaging-service
- notification-service
- event-service

### Step 5: Deploy Gateway and Frontend

The gateway and frontend are deployed as part of `k8s-deploy-all`, or manually:

```bash
kubectl apply -f k8s/gateway/
kubectl apply -f k8s/frontend/
```

### Step 6: Deploy Monitoring

```bash
make k8s-deploy-monitoring
```

This deploys:
- Prometheus (with PVC)
- Grafana (with PVC)
- Node Exporter (DaemonSet)
- Redis Exporter

### Step 7: Deploy Ingress

```bash
kubectl apply -f k8s/ingress/
```

## Accessing Services

### Port Forwarding (Recommended for Development)

```bash
make k8s-port-forward
```

This sets up port forwarding for:
- Kong Gateway: http://localhost:8000
- Kong Admin: http://localhost:8001
- Frontend: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

### NodePort Services

Alternatively, use NodePort services:

```bash
minikube service list
```

Access services using:
```bash
minikube service -n pulse kong
minikube service -n pulse frontend
minikube service -n pulse prometheus
minikube service -n pulse grafana
```

### Ingress (if enabled)

After enabling ingress addon, you can access services via Ingress:

```bash
# Get ingress IP
kubectl get ingress -n pulse

# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
# <ingress-ip> pulse.local
```

Then access:
- Frontend: http://pulse.local
- API Gateway: http://pulse.local/api

## Database Initialization

PostgreSQL databases are initialized automatically via a Job (`postgres-init-job.yaml`). The job:

1. Waits for PostgreSQL to be ready
2. Creates users: `pulse_auth`, `pulse_user`
3. Creates databases:
   - `pulse_auth_db`
   - `pulse_user_db`
   - `pulse_posts`
   - `pulse_social`

**Note**: Database schemas (Prisma migrations, SQL scripts) need to be run manually after the databases are created:

```bash
# For user-service
kubectl exec -it -n pulse deployment/user-service -- npx prisma db push

# For social-service
kubectl exec -it -n pulse deployment/social-service -- npx prisma db push

# For post-service
kubectl exec -it -n pulse deployment/post-service -- psql -h postgres -U pulse_user -d pulse_posts -f /path/to/init.sql
```

Or run these commands from your local machine (if you have access to the database):

```bash
# Port forward PostgreSQL
kubectl port-forward -n pulse service/postgres 5432:5432

# In another terminal, run migrations
cd user-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_user_db" npx prisma db push
cd social-service && DATABASE_URL="postgresql://pulse_user:pulse_user@localhost:5432/pulse_social" npx prisma db push
cd post-service && psql -U pulse_user -d pulse_posts -f init.sql -h localhost
```

## Monitoring and Observability

### Prometheus

- Access: http://localhost:9090 (via port-forward) or NodePort 30090
- Scrapes metrics from:
  - All microservices (`/metrics` endpoints)
  - Node Exporter (system metrics)
  - Redis Exporter
  - RabbitMQ metrics

### Grafana

- Access: http://localhost:3001 (via port-forward) or NodePort 30001
- Default credentials: `admin` / `admin`
- Pre-configured datasource: Prometheus
- Dashboards: Located in `config/grafana/`

## Troubleshooting

### Check Pod Status

```bash
make k8s-status
```

Or manually:
```bash
kubectl get pods -n pulse
kubectl get services -n pulse
kubectl get pvc -n pulse
```

### View Logs

```bash
# View logs for a specific service
make k8s-logs-auth-service
make k8s-logs-user-service
# etc.

# Or manually
kubectl logs -f -n pulse deployment/auth-service
```

### Describe Pods

```bash
kubectl describe pod <pod-name> -n pulse
```

### Check Events

```bash
kubectl get events -n pulse --sort-by='.lastTimestamp'
```

### Common Issues

#### 1. Pods Not Starting

- Check resource limits: `kubectl describe pod <pod-name> -n pulse`
- Verify images are built: `eval $(minikube docker-env) && docker images | grep pulse`
- Check ConfigMaps/Secrets: `kubectl get configmaps,secrets -n pulse`

#### 2. Database Connection Issues

- Verify database pods are running: `kubectl get pods -l app=postgres -n pulse`
- Check database service: `kubectl get svc postgres -n pulse`
- Verify database initialization job completed: `kubectl get jobs -n pulse`

#### 3. Service Discovery Issues

- Verify service DNS names: `kubectl exec -it -n pulse deployment/auth-service -- nslookup user-service`
- Check service endpoints: `kubectl get endpoints -n pulse`

#### 4. Image Pull Errors

- Ensure images are built in Minikube context: `make k8s-build`
- Verify imagePullPolicy is set to `Never` in deployments

#### 5. Persistent Volume Issues

- Check PVC status: `kubectl get pvc -n pulse`
- Verify storage class: `kubectl get storageclass`
- Minikube uses `standard` storage class by default

### Clean Up

To remove all resources:

```bash
make k8s-delete
```

Or manually:
```bash
kubectl delete namespace pulse
```

## Resource Limits

Current resource allocations (per service):

- **Microservices**: 
  - Requests: 100m CPU, 256Mi memory
  - Limits: 500m CPU, 512Mi memory
- **Databases**:
  - PostgreSQL: 250m CPU, 512Mi memory (requests)
  - MongoDB: 250m CPU, 1Gi memory (requests)
  - Redis: 100m CPU, 512Mi memory (requests)
  - RabbitMQ: 250m CPU, 1Gi memory (requests)
- **Monitoring**:
  - Prometheus: 250m CPU, 1Gi memory (requests)
  - Grafana: 100m CPU, 512Mi memory (requests)

Adjust these in the deployment manifests based on your Minikube resources and actual usage.

## Migration Checklist

- [ ] Minikube started with sufficient resources (4GB RAM, 2 CPU)
- [ ] Ingress addon enabled
- [ ] All Docker images built and loaded into Minikube
- [ ] Namespace created
- [ ] Secrets and ConfigMaps created
- [ ] Databases deployed and initialized
- [ ] Database schemas applied (Prisma migrations, SQL scripts)
- [ ] Microservices deployed
- [ ] Kong Gateway deployed
- [ ] Frontend deployed
- [ ] Monitoring stack deployed
- [ ] Ingress configured
- [ ] Services accessible via port-forward or NodePort
- [ ] Health checks passing
- [ ] Metrics collection working (Prometheus)
- [ ] Dashboards accessible (Grafana)

## Next Steps

1. **Production Hardening**:
   - Use proper secrets management (e.g., Sealed Secrets, External Secrets)
   - Implement network policies
   - Add resource quotas
   - Configure autoscaling
   - Set up proper backup strategies for persistent volumes

2. **CI/CD Integration**:
   - Build images in CI pipeline
   - Push images to container registry
   - Update imagePullPolicy to `IfNotPresent` or `Always`
   - Use image tags instead of `latest`

3. **Multi-Environment Setup**:
   - Use Kustomize or Helm for environment-specific configurations
   - Separate namespaces per environment
   - Environment-specific ConfigMaps and Secrets

4. **High Availability**:
   - Increase replica counts for services
   - Use StatefulSets for databases with multiple replicas
   - Configure pod disruption budgets
   - Set up anti-affinity rules

5. **Security**:
   - Implement RBAC
   - Use Pod Security Standards
   - Scan images for vulnerabilities
   - Enable network policies

## Useful Commands

```bash
# View all resources
kubectl get all -n pulse

# Get service URLs
minikube service list -n pulse

# Access Minikube dashboard
minikube dashboard

# SSH into Minikube VM
minikube ssh

# View resource usage
kubectl top pods -n pulse
kubectl top nodes

# Scale a deployment
kubectl scale deployment auth-service --replicas=2 -n pulse

# Restart a deployment
kubectl rollout restart deployment auth-service -n pulse

# View deployment history
kubectl rollout history deployment auth-service -n pulse

# Rollback a deployment
kubectl rollout undo deployment auth-service -n pulse
```

## Support

For issues or questions:
1. Check pod logs: `make k8s-logs-<service-name>`
2. Check pod status: `make k8s-status`
3. Review events: `kubectl get events -n pulse --sort-by='.lastTimestamp'`
4. Check documentation in `docs/` directory




