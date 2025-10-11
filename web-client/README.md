# Pulse Web Client

Modern Next.js 14 frontend for the Pulse microservices platform.

## Features

- 🔐 Authentication (Login/Register)
- 📝 Create and view posts
- ❤️ Like posts
- 👥 Follow/unfollow users
- 💬 Real-time messaging
- 🔔 Notifications
- 🔍 User search
- 👤 User profiles

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend microservices running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env.local
```

3. Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8084
JWT_SECRET=your-jwt-secret-here
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Production Build

```bash
npm run build
npm start
```

### Docker

Build and run with Docker:

```bash
docker build -t pulse-web-client .
docker run -p 3000:3000 pulse-web-client
```

Or use docker-compose from the root:

```bash
docker-compose up web-client
```

## Project Structure

```
web-client/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── feed/              # Feed page
│   ├── profile/           # Profile pages
│   ├── messages/          # Messaging page
│   ├── notifications/     # Notifications page
│   └── search/            # Search page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   ├── post/             # Post-related components
│   └── providers/        # Context providers
├── lib/                  # Core utilities
│   ├── api/             # API client functions
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand stores
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
```

## API Integration

The frontend connects to the backend microservices through the Kong API Gateway (default: `http://localhost:8000`).

### Services

- **User Service** - Authentication, user profiles
- **Post Service** - Posts, likes
- **Social Service** - Follow/unfollow, recommendations
- **Messaging Service** - Direct messages, conversations
- **Notification Service** - Notifications, preferences

## Features Detail

### Authentication
- JWT-based authentication
- Automatic token refresh
- Protected routes

### Posts
- Create posts (280 character limit)
- Like/unlike posts
- Delete own posts
- Real-time feed updates

### Social
- Follow/unfollow users
- View followers/following
- User recommendations
- Social stats

### Messaging
- Direct conversations
- Group chats (planned)
- Real-time messaging via WebSocket
- Read receipts

### Notifications
- Real-time notifications
- Mark as read
- Unread count badge
- Multiple notification types

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API Gateway URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8084` |
| `JWT_SECRET` | JWT secret for server-side operations | - |

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow the component naming conventions
4. Add proper error handling
5. Test with the backend services

## License

MIT
