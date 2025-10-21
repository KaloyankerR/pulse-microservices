# Pulse Frontend

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
docker build -t pulse-frontend .
docker run -p 3000:3000 pulse-frontend
```

Or use docker-compose from the root:

```bash
docker-compose up frontend
```

## Project Structure

```
frontend/
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

## Complete User Workflow

### Registration → Login → View Posts → Create Post

The complete end-to-end user journey:

1. **Visit site** → Redirected to `/feed`
2. **Not authenticated** → Shows login/register prompt
3. **Click Register** → Fill form and submit
4. **Backend creates user** → Frontend auto-logs in
5. **Tokens stored** → Redirected to authenticated feed
6. **Posts loaded** → Can view all posts
7. **Create post** → Type in form and submit
8. **Post appears** → Shows at top of feed immediately

All components work together seamlessly with proper error handling and debug logging.

## Documentation

- **`API_WORKFLOW.md`**: Complete API workflow documentation with request/response examples
- **`DEBUG_REFERENCE.md`**: Quick debugging reference with console commands
- **`../docs/API_SPECIFICATION.md`**: Backend API specification

## Debugging

All modules use prefixed console logs for easy filtering:

```javascript
// In browser console, filter by:
[API Client]    - HTTP requests/responses
[Auth API]      - Authentication operations
[Posts API]     - Post operations
[Auth Store]    - State changes
[usePosts]      - Post state changes
```

### Quick Debug Commands

```javascript
// Check authentication
localStorage.getItem('accessToken')

// Decode JWT token
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token:', payload);

// Clear and re-login
localStorage.clear();
window.location.href = '/auth/login';
```

See `DEBUG_REFERENCE.md` for comprehensive debugging guide.

## Common Issues

1. **401 Unauthorized**: Token expired → Clear localStorage and re-login
2. **CORS Errors**: Kong Gateway not running → Start Kong
3. **Posts Not Loading**: Check console `[Posts API]` logs
4. **Registration Fails**: Password must be 8+ chars with uppercase, lowercase, number, special char

## API Response Format Differences

**Important**: Different services use different response formats:

### User Service (Node.js) - WRAPPED
```json
{
  "success": true,
  "data": { "user": {...}, "accessToken": "..." },
  "meta": {...}
}
```

### Post Service (Go) - NOT WRAPPED
```json
{
  "posts": [...],
  "page": 0,
  "total_posts": 100
}
```

The frontend handles both formats correctly.

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow the component naming conventions
4. Add proper error handling
5. Add console logs with appropriate prefix (e.g., `[ComponentName]`)
6. Test with the backend services

## License

MIT

---

**Last Updated**: October 12, 2025  
**For detailed workflows and debugging, see `API_WORKFLOW.md` and `DEBUG_REFERENCE.md`**
