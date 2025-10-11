# Docker Architecture Diagram

This diagram illustrates the Docker setup and deployment process for the Pulse social platform application.

## Docker Process Flow

```mermaid
graph TB
    subgraph "Development Environment"
        DEV[Developer]
        CODE[Source Code]
        ENV[docker.env]
    end

    subgraph "Docker Build Process"
        subgraph "Multi-Stage Build"
            BASE[Base Image<br/>node:20-alpine]
            DEPS[Dependencies Stage<br/>Install production deps]
            BUILDER[Builder Stage<br/>Install all deps<br/>Generate Prisma client<br/>Build application]
            RUNNER[Runner Stage<br/>Production image<br/>Minimal footprint]
        end

        DOCKERFILE[Dockerfile]
        COMPOSE[docker-compose.yml]
    end

    subgraph "Container Runtime"
        CONTAINER[Pulse Container<br/>Port: 3000]
        HEALTH[Health Check<br/>/api/current endpoint]
    end

    subgraph "External Services"
        MONGODB[(MongoDB Atlas<br/>Database)]
        GOOGLE[Google OAuth<br/>Authentication]
    end

    subgraph "Application Features"
        API[REST API<br/>Next.js API Routes]
        AUTH[NextAuth.js<br/>Authentication]
        PRISMA[Prisma ORM<br/>Database Access]
        UI[React UI<br/>Social Platform]
    end

    %% Development Flow
    DEV --> CODE
    CODE --> DOCKERFILE
    ENV --> COMPOSE

    %% Build Process
    DOCKERFILE --> BASE
    BASE --> DEPS
    DEPS --> BUILDER
    BUILDER --> RUNNER
    RUNNER --> CONTAINER

    %% Runtime Configuration
    COMPOSE --> CONTAINER
    CONTAINER --> HEALTH

    %% External Connections
    CONTAINER --> MONGODB
    CONTAINER --> GOOGLE

    %% Application Components
    CONTAINER --> API
    CONTAINER --> AUTH
    CONTAINER --> PRISMA
    CONTAINER --> UI

    %% Health Check Flow
    HEALTH --> API

    %% Styling
    classDef buildStage fill:#e1f5fe
    classDef runtime fill:#f3e5f5
    classDef external fill:#fff3e0
    classDef app fill:#e8f5e8

    class BASE,DEPS,BUILDER,RUNNER buildStage
    class CONTAINER,HEALTH runtime
    class MONGODB,GOOGLE external
    class API,AUTH,PRISMA,UI app
```

## Docker Commands Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Docker as Docker Engine
    participant Container as Pulse Container
    participant DB as MongoDB Atlas
    participant Auth as Google OAuth

    Note over Dev,Auth: Docker Build & Deploy Process

    Dev->>Docker: docker-compose build
    Note over Docker: Multi-stage build process
    Docker->>Docker: Base: node:20-alpine
    Docker->>Docker: Deps: Install production deps
    Docker->>Docker: Builder: Install all deps, generate Prisma, build app
    Docker->>Docker: Runner: Create production image

    Dev->>Docker: docker-compose up -d
    Docker->>Container: Start container with env vars
    Container->>Container: Initialize Next.js app
    Container->>DB: Connect to MongoDB
    Container->>Auth: Configure OAuth

    Note over Container: Health checks every 30s
    loop Health Check
        Container->>Container: Check /api/current endpoint
    end

    Note over Dev,Auth: Application Runtime
    Dev->>Container: HTTP requests (port 3000)
    Container->>DB: Database operations
    Container->>Auth: Authentication requests
    Container->>Dev: Response with UI/API data
```

## Container Architecture

```mermaid
graph LR
    subgraph "Pulse Container (Alpine Linux)"
        subgraph "Application Layer"
            NEXT[Next.js Server<br/>Port 3000]
            API_ROUTES[API Routes<br/>/api/*]
            PAGES[React Pages<br/>/pages/*]
        end

        subgraph "Authentication"
            NEXTAUTH[NextAuth.js<br/>Session Management]
            JWT[JWT Tokens]
        end

        subgraph "Database Layer"
            PRISMA_CLIENT[Prisma Client]
            CONNECTION[DB Connection Pool]
        end

        subgraph "Security & Monitoring"
            HEALTH_CHECK[Health Check<br/>Every 30s]
            NON_ROOT[Non-root User<br/>nextjs:nodejs]
        end
    end

    subgraph "External Dependencies"
        MONGODB_ATLAS[(MongoDB Atlas<br/>Cloud Database)]
        GOOGLE_OAUTH[Google OAuth<br/>Authentication Provider]
    end

    NEXT --> API_ROUTES
    NEXT --> PAGES
    API_ROUTES --> NEXTAUTH
    NEXTAUTH --> JWT
    API_ROUTES --> PRISMA_CLIENT
    PRISMA_CLIENT --> CONNECTION
    CONNECTION --> MONGODB_ATLAS
    NEXTAUTH --> GOOGLE_OAUTH
    HEALTH_CHECK --> API_ROUTES

    classDef container fill:#e3f2fd
    classDef external fill:#fff3e0
    classDef security fill:#fce4ec

    class NEXT,API_ROUTES,PAGES,NEXTAUTH,JWT,PRISMA_CLIENT,CONNECTION container
    class MONGODB_ATLAS,GOOGLE_OAUTH external
    class HEALTH_CHECK,NON_ROOT security
```

## Environment Configuration

```mermaid
graph TD
    subgraph "Environment Files"
        DOCKER_ENV[docker.env<br/>Production Config]
        ENV_VARS[Environment Variables]
    end

    subgraph "Required Variables"
        DB_URL[DATABASE_URL<br/>MongoDB Connection]
        AUTH_SECRET[NEXTAUTH_SECRET<br/>Session Secret]
        JWT_SECRET[NEXTAUTH_JWT_SECRET<br/>JWT Secret]
    end

    subgraph "Optional Variables"
        GOOGLE_ID[GOOGLE_CLIENT_ID<br/>OAuth Client ID]
        GOOGLE_SECRET[GOOGLE_CLIENT_SECRET<br/>OAuth Secret]
        NEXTAUTH_URL[NEXTAUTH_URL<br/>Base URL]
    end

    subgraph "Runtime Environment"
        NODE_ENV[NODE_ENV=production]
        PORT[PORT=3000]
        HOSTNAME[HOSTNAME=0.0.0.0]
    end

    DOCKER_ENV --> ENV_VARS
    ENV_VARS --> DB_URL
    ENV_VARS --> AUTH_SECRET
    ENV_VARS --> JWT_SECRET
    ENV_VARS --> GOOGLE_ID
    ENV_VARS --> GOOGLE_SECRET
    ENV_VARS --> NEXTAUTH_URL
    ENV_VARS --> NODE_ENV
    ENV_VARS --> PORT
    ENV_VARS --> HOSTNAME

    classDef required fill:#ffebee
    classDef optional fill:#e8f5e8
    classDef runtime fill:#e3f2fd

    class DB_URL,AUTH_SECRET,JWT_SECRET required
    class GOOGLE_ID,GOOGLE_SECRET,NEXTAUTH_URL optional
    class NODE_ENV,PORT,HOSTNAME runtime
```

## Key Features

### Multi-Stage Build Process

- **Base Stage**: Uses Node.js 20 Alpine for compatibility
- **Dependencies Stage**: Installs only production dependencies
- **Builder Stage**: Installs all dependencies, generates Prisma client, builds the application
- **Runner Stage**: Creates minimal production image with only necessary files

### Security Features

- Runs as non-root user (`nextjs:nodejs`)
- Proper file permissions and ownership
- Minimal Alpine Linux base image
- Health checks for monitoring

### Performance Optimizations

- Leverages Next.js standalone output
- Optimized layer caching
- Native module support (bcrypt, etc.)
- Proper static file handling

### External Integrations

- MongoDB Atlas for database storage
- Google OAuth for authentication
- Health check endpoint for monitoring
