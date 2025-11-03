---
config:
  layout: dagre
  look: neo
  theme: base
  flowchart:
    curve: linear
    rankSpacing: 90
    nodeSpacing: 70
  themeVariables:
    lineColor: '#2f3640'
    edgeLabelBackground: '#ffffff'
    clusterBkg: '#f7f9fc'
    clusterBorder: '#b0b9c5'
---
flowchart LR

  %% LAYERS
  subgraph L0["Client Layer"]
    Client["Client/Frontend\nNext.js\nlocalhost:3000"]
  end

  subgraph L1["API Gateway Layer"]
    Kong["Kong API Gateway\n:8000\nDB-less Mode"]
  end

  subgraph L2["Microservices Layer"]
    direction TB
    UserService["User Service\nNode.js + Prisma\n:8081\nAuth &amp; Users"]
    PostService["Post Service\nGo\n:8082\nPosts &amp; Likes"]
    SocialService["Social Service\nNode.js + Prisma\n:8085\nFollows &amp; Feeds"]
    MessagingService["Messaging Service\nGo\n:8084\nChat &amp; WebSocket"]
    NotificationService["Notification Service\nNode.js\n:8086\nPush Notifications"]
  end

  subgraph L3["Data Layer"]
    direction TB
    subgraph SQL["PostgreSQL :5432"]
      UserDB[("pulse_users DB\nAuth &amp; Profiles")]
      PostDB[("pulse_posts DB\nPosts &amp; Interactions")]
      SocialDB[("pulse_social DB\nRelationships &amp; Feeds")]
    end

    subgraph NOSQL["MongoDB :27017"]
      MessageDB[("messaging_db\nMessages &amp; Conversations")]
      NotificationDB[("pulse_notifications\nNotification History")]
    end

    Redis[("Redis :6379\nCaching &amp; Sessions")]
  end

  subgraph L4["Message Queue Layer"]
    RabbitMQ[("RabbitMQ :5672\nEvents\nMgmt UI :15672")]
  end

  subgraph L5["Observability"]
    Prometheus["Prometheus\n:9090\nMetrics Scraping"]
    Grafana["Grafana\n:3001\nDashboards"]
  end

  subgraph L6["CI/CD & Quality"]
    GitHubActions["GitHub Actions\nMatrix CI/CD"]
    SonarQube["SonarQube\n:9001\nCode Quality"]
  end

  subgraph L7["Infrastructure"]
    Docker["Docker Compose\nContainer Orchestration"]
  end

  %% ROUTING THROUGH GATEWAY (SOLID = SYNC HTTP)
  Client -->|HTTP| Kong
  Kong -->|auth, users| UserService
  Kong -->|posts| PostService
  Kong -->|social| SocialService
  Kong -->|messages, ws| MessagingService
  Kong -->|notifications| NotificationService

  %% SERVICE → DATA (SOLID = DIRECT DATA ACCESS)
  UserService -->|Prisma| UserDB
  PostService -->|Driver| PostDB
  SocialService -->|Prisma| SocialDB
  MessagingService -->|Mongo Driver| MessageDB
  NotificationService -->|Mongo Driver| NotificationDB

  %% CACHING
  UserService -->|Sessions| Redis
  SocialService -->|Feed Cache| Redis
  MessagingService -->|Presence| Redis
  NotificationService -->|Rate Limit| Redis

  %% EVENTS (DOTTED = ASYNC)
  UserService -. "user.registered,user.updated" .-> RabbitMQ
  PostService  -. "post.created,post.liked" .-> RabbitMQ
  SocialService -. "follow.created,feed.updated" .-> RabbitMQ
  MessagingService -. "message.sent,user.online" .-> RabbitMQ
  NotificationService -. "notification.sent" .-> RabbitMQ

  %% SERVICE-TO-SERVICE (DOTTED = INTERNAL CALLS)
  PostService -. "fetch user" .-> UserService
  SocialService -. "user check" .-> UserService
  MessagingService -. "auth check" .-> UserService
  NotificationService -. "user prefs" .-> UserService

  %% CI/CD & DEPLOYMENT
  GitHubActions -. "code quality" .-> SonarQube
  GitHubActions -. "deploy" .-> Docker

  %% OBSERVABILITY
  Kong -. "metrics" .-> Prometheus
  UserService -. "metrics" .-> Prometheus
  PostService -. "metrics" .-> Prometheus
  SocialService -. "metrics" .-> Prometheus
  MessagingService -. "metrics" .-> Prometheus
  NotificationService -. "metrics" .-> Prometheus
  Prometheus --> Grafana

  %% STYLES
  classDef serviceStyle fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
  classDef dbStyle fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
  classDef gatewayStyle fill:#FF6B6B,stroke:#C44D4D,stroke-width:3px,color:#fff
  classDef clientStyle fill:#FFD93D,stroke:#C4A02D,stroke-width:2px,color:#333
  classDef cicdStyle fill:#9370DB,stroke:#6A4CA5,stroke-width:2px,color:#fff
  classDef infraStyle fill:#20B2AA,stroke:#008B8B,stroke-width:2px,color:#fff
  classDef mqStyle fill:#FF8C00,stroke:#FF7F00,stroke-width:2px,color:#fff
  classDef observabilityStyle fill:#2d3748,stroke:#1a202c,stroke-width:2px,color:#fff

  Client:::clientStyle
  Kong:::gatewayStyle
  UserService:::serviceStyle
  PostService:::serviceStyle
  SocialService:::serviceStyle
  MessagingService:::serviceStyle
  NotificationService:::serviceStyle
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