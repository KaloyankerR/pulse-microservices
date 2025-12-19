# Pulse Microservices


Microservices platform with API Gateway, user authentication, post management, and social features.

## Services

### Backend Services
- **Kong API Gateway** (port 8000) - Routes all requests
- **Auth Service** (Node.js) - Authentication & JWT tokens (port 8080)
- **User Service** (Node.js) - User management (port 8081)
- **Post Service** (Go) - Posts, likes, and user cache (port 8082)
- **Event Service** (Go) - Event handling (port 8083)
- **Messaging Service** (Go) - Real-time messaging & WebSocket support (port 8084)
- **Social Service** (Node.js) - Follow relationships & recommendations (port 8085)
- **Notification Service** (Node.js) - Push notifications & user preferences (port 8086)

### Frontend
- **Frontend** (Next.js) - Neo-Brutalism inspired design (port 3000)

### Infrastructure
- **PostgreSQL** - Relational database
- **MongoDB** - Document database
- **Redis** - Caching & session storage
- **RabbitMQ** - Message broker
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization

## Quick Start

### Docker Compose (Local Development)
```bash
make db-setup    # Setup databases (first time only)
make up          # Start all services
```

Access:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000

### Kubernetes Deployment
- **Local**: Minikube - See [k8s/README.md](k8s/README.md)
- **Production**: DigitalOcean Kubernetes cluster

```bash
# Local Minikube
make k8s-start
make k8s-build
make k8s-deploy

# DigitalOcean Production
export KUBECONFIG=./pulse-cluster-kubeconfig.yaml
kubectl get pods -n pulse
```

## Frontend Design

The frontend features a **Neo-Brutalism** inspired design system:
- **Bold black borders** (3px+) on all major elements
- **Flat, solid colors** with high contrast
- **Hard drop shadows** with no blur (offset shadows)
- **Sharp corners** (minimal border radius)
- **Chunky typography** with monospace fonts
- **Playful color blocking** with vibrant accents

This design philosophy emphasizes boldness, clarity, and unapologetic visual weight through thickness and geometric shapes.

## Common Commands

```bash
make up          # Start all services
make down        # Stop all services
make logs        # View logs
make ps          # List services
make test        # Health checks
make db-reset    # Reset all databases
```

## Architecture

- **7 Microservices** communicating via Kong API Gateway
- **Service-to-service** communication via RabbitMQ events
- **Databases**: PostgreSQL (Prisma services), MongoDB (messaging/notifications)
- **Caching**: Redis for sessions and feed caching
- **Monitoring**: Prometheus + Grafana for metrics and dashboards

See [docs/fontys/diagram.md](docs/fontys/diagram.md) for detailed architecture diagram.

## Project Structure

```
pulse-microservices/
├── docker-compose.yml          # Local development
├── k8s/                        # Kubernetes manifests
├── frontend/                   # Next.js frontend (Neo-Brutalism design)
├── auth-service/               # Node.js + Prisma
├── user-service/               # Node.js + Prisma
├── post-service/               # Go service
├── event-service/              # Go service
├── social-service/             # Node.js + Prisma
├── messaging-service/          # Go service
├── notification-service/       # Node.js service
└── docs/                       # Documentation
```

## Documentation

- **[Kubernetes Deployment](k8s/README.md)** - K8s setup for Minikube and DigitalOcean
- **[Architecture Diagram](docs/fontys/diagram.md)** - Visual system architecture
- **[Frontend README](frontend/README.md)** - Frontend setup and development
