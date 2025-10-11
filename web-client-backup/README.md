# Pulse Web Client

The frontend application for the Pulse microservices social media platform, built with Next.js, React, and TypeScript.

## 🏗️ Architecture

This web client is part of a larger microservices architecture and communicates with backend services through Kong API Gateway.

### Backend Services Integration

- **User Service** (Node.js) - Port 8081: Authentication, user profiles, OAuth2
- **Post Service** (Go) - Port 8082: Posts, likes, comments
- **Social Service** (Node.js) - Port 8085: Follow/unfollow, social graph
- **Messaging Service** (Go) - Port 8084: Direct messages, conversations
- **Notification Service** (Node.js) - Port 8086: Real-time notifications
- **Kong Gateway** - Port 8000: API Gateway routing all requests

## 🚀 Quick Start

### Running with Full Stack (Recommended)

From the project root directory:

```bash
# Start all microservices and the web client
docker-compose up -d

# View logs
docker-compose logs -f web-client

# Access the application
# Navigate to http://localhost:3000
```

### Running Standalone (Development)

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev

# Access at http://localhost:3000
```

### Running with Docker Only

```bash
# Build the image
npm run docker:build

# Start the container
npm run docker:start

# View logs
npm run docker:logs

# Stop the container
npm run docker:stop
```

## 🔧 Configuration

### Environment Variables

Create a `docker.env` file in the web-client directory:

```env
# API Gateway Configuration
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MICROSERVICES_ENABLED=true

# JWT Configuration (must match backend)
JWT_SECRET=5b41d6a0c1adfd2804d730d26f7a4fd1

# NextAuth Configuration (if using NextAuth)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### Microservices Configuration

The microservices endpoints are configured in `config/microservices.config.ts`. This file maps frontend API calls to the appropriate backend service through Kong Gateway.

## 📚 Available Commands

| Command                  | Description                           |
| ------------------------ | ------------------------------------- |
| `npm run dev`            | Start development server              |
| `npm run build`          | Build for production                  |
| `npm run start`          | Start production server               |
| `npm run lint`           | Run ESLint                            |
| `npm run lint:fix`       | Fix ESLint issues                     |
| `npm run format`         | Format code with Prettier             |
| `npm run type-check`     | Run TypeScript type checking          |
| `npm run docker:build`   | Build Docker image                    |
| `npm run docker:start`   | Start Docker container                |
| `npm run docker:stop`    | Stop Docker container                 |
| `npm run docker:logs`    | View container logs                   |
| `npm run docker:restart` | Restart container                     |

## 🏗️ Tech Stack

- **Framework**: Next.js 13.2.4
- **Language**: TypeScript 5.0.2
- **UI Library**: React 18.2.0
- **Styling**: Tailwind CSS, Material-UI, Styled Components
- **State Management**: Zustand, SWR
- **HTTP Client**: Axios
- **Authentication**: NextAuth.js (Optional), JWT
- **Date Handling**: date-fns, dayjs
- **Form Handling**: react-dropzone
- **Notifications**: react-hot-toast

## 📁 Project Structure

```
web-client/
├── components/          # React components
│   ├── chat/           # Chat-related components
│   ├── events/         # Event management components
│   ├── follow/         # Follow/unfollow components
│   ├── modals/         # Modal dialogs
│   ├── notifications/  # Notification components
│   ├── posts/          # Post-related components
│   ├── shared/         # Reusable components
│   └── users/          # User profile components
├── config/             # Configuration files
│   └── microservices.config.ts  # Backend service endpoints
├── hooks/              # Custom React hooks
├── libs/               # Utility libraries
├── base/               # Design system tokens
├── pages/              # Next.js pages
├── public/             # Static assets
└── docs/               # Documentation
```

## 🔗 API Integration

All API calls go through Kong Gateway (`http://localhost:8000`) which routes to the appropriate microservice:

```typescript
// Example: User authentication
POST http://localhost:8000/api/v1/auth/login

// Example: Create a post
POST http://localhost:8000/api/v1/posts

// Example: Follow a user
POST http://localhost:8000/api/v1/social/follow/:userId
```

See `config/microservices.config.ts` for complete endpoint mappings.

## 🐳 Docker Integration

The web client is integrated into the main `docker-compose.yml` and connects to the `pulse-network`:

- Container name: `pulse-web-client`
- Exposed port: `3000`
- Depends on: Kong Gateway and all backend services
- Health check: Validates `/api/current` endpoint

## 📖 Additional Documentation

- **[Frontend Integration Guide](FRONTEND-INTEGRATION-GUIDE.md)** - Detailed integration guide
- **[Microservices Integration](MICROSERVICES-INTEGRATION.md)** - Backend service integration
- **[Integration Context](INTEGRATION-CONTEXT.md)** - Context and architecture overview
- **[Documentation Directory](docs/)** - Feature-specific documentation

## 🤝 Contributing

1. Follow the existing code style (ESLint + Prettier configured)
2. Write type-safe TypeScript code
3. Test changes locally before committing
4. Update documentation as needed

## 📄 License

MIT License - Part of the Pulse Microservices Platform
