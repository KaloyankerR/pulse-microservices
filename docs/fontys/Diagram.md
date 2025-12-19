---
config:
  layout: dagre
  look: neo
  theme: base
  flowchart:
    curve: linear
    rankSpacing: 50
    nodeSpacing: 40
  themeVariables:
    lineColor: '#2f3640'
    edgeLabelBackground: '#ffffff'
    clusterBkg: '#f7f9fc'
    clusterBorder: '#b0b9c5'
---
flowchart TB

  %% KUBERNETES INFRASTRUCTURE
  subgraph K8s["Kubernetes Cluster (Minikube/DigitalOcean)"]
    subgraph NS["Namespace: pulse"]
      
      subgraph L0["Client Layer"]
        Client["Frontend (Next.js :3000)"]
      end

      subgraph L1["API Gateway"]
        Kong["Kong Gateway (:8000)"]
        Ingress["NGINX Ingress"]
      end

      subgraph L2["Microservices (7 Services)"]
        direction LR
        AuthService["Auth Service<br/>Node.js :8080"]
        UserService["User Service<br/>Node.js :8081"]
        PostService["Post Service<br/>Go :8082"]
        EventService["Event Service<br/>Go :8083"]
        SocialService["Social Service<br/>Node.js :8085"]
        MessagingService["Messaging Service<br/>Go :8084"]
        NotificationService["Notification Service<br/>Node.js :8086"]
      end

      subgraph L3["Data Layer"]
        direction LR
        subgraph SQL["PostgreSQL"]
          AuthDB[("pulse_auth_db")]
          UserDB[("pulse_user_db")]
          PostDB[("pulse_posts")]
          SocialDB[("pulse_social")]
        end
        subgraph NOSQL["MongoDB"]
          MessageDB[("messaging_db")]
          NotificationDB[("notifications")]
        end
        Redis[("Redis :6379")]
      end

      subgraph L4["Message Queue"]
        RabbitMQ[("RabbitMQ :5672")]
      end

      subgraph L5["Monitoring"]
        Prometheus["Prometheus :9090"]
        Grafana["Grafana :3001"]
      end
    end
  end

  subgraph L6["CI/CD & Infrastructure"]
    GitHubActions["GitHub Actions"]
    SonarQube["SonarQube"]
    Docker["Docker Compose"]
  end

  %% ROUTING
  Ingress -->|"/"| Client
  Ingress -->|"/api"| Kong
  Client -->|HTTP| Kong
  Kong --> AuthService
  Kong --> UserService
  Kong --> PostService
  Kong --> EventService
  Kong --> SocialService
  Kong --> MessagingService
  Kong --> NotificationService

  %% DATA ACCESS
  AuthService -->|Prisma| AuthDB
  UserService -->|Prisma| UserDB
  PostService -->|Driver| PostDB
  SocialService -->|Prisma| SocialDB
  MessagingService -->|Mongo| MessageDB
  NotificationService -->|Mongo| NotificationDB

  %% CACHING
  AuthService --> Redis
  UserService --> Redis
  SocialService --> Redis
  MessagingService --> Redis
  NotificationService --> Redis

  %% EVENTS
  AuthService -.-> RabbitMQ
  UserService -.-> RabbitMQ
  PostService -.-> RabbitMQ
  SocialService -.-> RabbitMQ
  MessagingService -.-> RabbitMQ
  NotificationService -.-> RabbitMQ
  RabbitMQ -.-> EventService

  %% SERVICE-TO-SERVICE
  AuthService -.-> UserService
  PostService -.-> UserService
  SocialService -.-> UserService
  MessagingService -.-> AuthService
  NotificationService -.-> UserService

  %% OBSERVABILITY
  Kong -.-> Prometheus
  AuthService -.-> Prometheus
  UserService -.-> Prometheus
  PostService -.-> Prometheus
  EventService -.-> Prometheus
  SocialService -.-> Prometheus
  MessagingService -.-> Prometheus
  NotificationService -.-> Prometheus
  Prometheus --> Grafana

  %% CI/CD
  GitHubActions -.-> SonarQube
  GitHubActions -.-> Docker
  Docker -.-> K8s

  %% STYLES
  classDef serviceStyle fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
  classDef dbStyle fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
  classDef gatewayStyle fill:#FF6B6B,stroke:#C44D4D,stroke-width:3px,color:#fff
  classDef clientStyle fill:#FFD93D,stroke:#C4A02D,stroke-width:2px,color:#333
  classDef cicdStyle fill:#9370DB,stroke:#6A4CA5,stroke-width:2px,color:#fff
  classDef infraStyle fill:#20B2AA,stroke:#008B8B,stroke-width:2px,color:#fff
  classDef mqStyle fill:#FF8C00,stroke:#FF7F00,stroke-width:2px,color:#fff
  classDef observabilityStyle fill:#2d3748,stroke:#1a202c,stroke-width:2px,color:#fff
  classDef k8sStyle fill:#326CE5,stroke:#1E4A8C,stroke-width:3px,color:#fff

  Client:::clientStyle
  Ingress:::gatewayStyle
  Kong:::gatewayStyle
  AuthService:::serviceStyle
  UserService:::serviceStyle
  PostService:::serviceStyle
  EventService:::serviceStyle
  SocialService:::serviceStyle
  MessagingService:::serviceStyle
  NotificationService:::serviceStyle
  AuthDB:::dbStyle
  UserDB:::dbStyle
  PostDB:::dbStyle
  SocialDB:::dbStyle
  MessageDB:::dbStyle
  NotificationDB:::dbStyle
  Redis:::dbStyle
  RabbitMQ:::mqStyle
  GitHubActions:::cicdStyle
  SonarQube:::cicdStyle
  Docker:::infraStyle
  Prometheus:::observabilityStyle
  Grafana:::observabilityStyle
  K8s:::k8sStyle

---

flowchart TB

  subgraph K8sRes["Kubernetes Resources - Namespace: pulse"]
    
    subgraph Workloads["Workloads"]
      Deployments["Deployments<br/>(7 microservices + frontend + infra)"]
      StatefulSet["StatefulSet<br/>(PostgreSQL)"]
      Job["Job<br/>(postgres-init)"]
      DaemonSet["DaemonSet<br/>(node-exporter)"]
    end

    subgraph Networking["Networking"]
      Services["Services<br/>(ClusterIP - internal)"]
      Ingress["Ingress<br/>(NGINX - external)"]
    end

    subgraph Config["Configuration"]
      ConfigMaps["ConfigMaps<br/>(env vars, configs)"]
      Secrets["Secrets<br/>(JWT, passwords)"]
    end

    subgraph Storage["Storage"]
      PVCs["PersistentVolumeClaims<br/>(databases, monitoring)"]
    end
  end

  Deployments --> Services
  StatefulSet --> Services
  Ingress --> Services
  ConfigMaps -.-> Deployments
  Secrets -.-> Deployments
  Secrets -.-> StatefulSet
  PVCs -.-> StatefulSet
  PVCs -.-> Deployments
  Job -.-> StatefulSet

  classDef workloadStyle fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
  classDef networkStyle fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
  classDef configStyle fill:#FFA500,stroke:#CC7700,stroke-width:2px,color:#fff
  classDef storageStyle fill:#20B2AA,stroke:#008B8B,stroke-width:2px,color:#fff
  classDef k8sResStyle fill:#326CE5,stroke:#1E4A8C,stroke-width:3px,color:#fff

  Deployments:::workloadStyle
  StatefulSet:::workloadStyle
  Job:::workloadStyle
  DaemonSet:::workloadStyle
  Services:::networkStyle
  Ingress:::networkStyle
  ConfigMaps:::configStyle
  Secrets:::configStyle
  PVCs:::storageStyle
  K8sRes:::k8sResStyle
