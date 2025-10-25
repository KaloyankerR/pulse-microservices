# Pulse Microservices - Backend API Specification

## Overview

This document provides a comprehensive specification of all backend APIs across the Pulse microservices platform. It's designed to help frontend developers understand what APIs are available, how to use them, and what data they expect and return.

## Table of Contents

1. [Authentication](#authentication)
2. [Common Patterns](#common-patterns)
3. [User Service APIs](#user-service-apis)
4. [Post Service APIs](#post-service-apis)
5. [Messaging Service APIs](#messaging-service-apis)
6. [Notification Service APIs](#notification-service-apis)
7. [Social Service APIs](#social-service-apis)

---

## Authentication

### Token-Based Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Structure

The JWT token contains the following claims:
```json
{
  "id": "user_id",
  "userId": "user_id",
  "email": "user@example.com",
  "username": "username",
  "role": "USER"
}
```

### Obtaining Tokens

Use the `/api/v1/auth/login` endpoint to obtain access and refresh tokens.

---

## Common Patterns

### Success Response Format

All services return responses in a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

### Pagination

Paginated endpoints typically support the following query parameters:
- `page`: Page number (default: 1)
- `limit` or `size`: Items per page (default varies by service)

Paginated responses include:
```json
{
  "data": [...],
  "count": 20,
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

---

## User Service APIs

**Base URL**: `http://localhost:8080` (Development)  
**API Prefix**: `/api/v1`

### Authentication Endpoints

#### 1. Register User

**Endpoint**: `POST /api/v1/auth/register`  
**Authentication**: None  
**Rate Limited**: Yes

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123!",
  "displayName": "Display Name" // Optional
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "bio": null,
      "avatarUrl": null,
      "verified": false,
      "createdAt": "2025-10-11T12:00:00.000Z",
      "updatedAt": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Validation error
- 409: User already exists

---

#### 2. Login User

**Endpoint**: `POST /api/v1/auth/login`  
**Authentication**: None  
**Rate Limited**: Yes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "bio": "User bio",
      "avatarUrl": "https://example.com/avatar.jpg",
      "verified": false,
      "createdAt": "2025-10-11T12:00:00.000Z",
      "updatedAt": "2025-10-11T12:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": "1h"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Invalid credentials

---

#### 3. Refresh Access Token

**Endpoint**: `POST /api/v1/auth/refresh`  
**Authentication**: None  
**Rate Limited**: Yes

**Request Body**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token",
    "expiresIn": "1h"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Invalid refresh token

---

#### 4. Logout

**Endpoint**: `POST /api/v1/auth/logout`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Request Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

#### 5. Get Current User

**Endpoint**: `GET /api/v1/auth/me`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Request Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "bio": "User bio",
      "avatarUrl": "https://example.com/avatar.jpg",
      "verified": false,
      "createdAt": "2025-10-11T12:00:00.000Z",
      "updatedAt": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

#### 6. Change Password

**Endpoint**: `POST /api/v1/auth/change-password`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Invalid current password or weak new password
- 401: Unauthorized

---

### User Management Endpoints

#### 7. Get Current User Profile

**Endpoint**: `GET /api/v1/users/profile`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "bio": "User bio",
      "avatarUrl": "https://example.com/avatar.jpg",
      "verified": false,
      "followersCount": 100,
      "followingCount": 50,
      "createdAt": "2025-10-11T12:00:00.000Z",
      "updatedAt": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

---

#### 8. Update Current User Profile

**Endpoint**: `PUT /api/v1/users/profile`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Request Body**:
```json
{
  "displayName": "New Display Name",
  "bio": "Updated bio text",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "displayName": "New Display Name",
      "bio": "Updated bio text",
      "avatarUrl": "https://example.com/new-avatar.jpg",
      "verified": false,
      "createdAt": "2025-10-11T12:00:00.000Z",
      "updatedAt": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized

---

#### 9. Get User by ID

**Endpoint**: `GET /api/v1/users/:id`  
**Authentication**: Optional (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "username",
      "displayName": "Display Name",
      "bio": "User bio",
      "avatarUrl": "https://example.com/avatar.jpg",
      "verified": false,
      "followersCount": 100,
      "followingCount": 50,
      "createdAt": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 404: User not found

---

#### 10. Search Users

**Endpoint**: `GET /api/v1/users/search`  
**Authentication**: Optional (Bearer Token)  
**Rate Limited**: Yes

**Query Parameters**:
- `q`: Search query (username or display name)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg",
        "verified": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

---

#### 11. Update User Profile (by ID)

**Endpoint**: `PUT /api/v1/users/:id`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes  
**Authorization**: User can only update their own profile

**URL Parameters**:
- `id`: User UUID

**Request Body**:
```json
{
  "displayName": "New Display Name",
  "bio": "Updated bio text",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response** (200 OK): Same as Update Current User Profile

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (trying to update another user's profile)

---

#### 12. Delete User

**Endpoint**: `DELETE /api/v1/users/:id`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes  
**Authorization**: User can only delete their own account

**URL Parameters**:
- `id`: User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden

---

#### 13. Follow User

**Endpoint**: `POST /api/v1/users/:id/follow`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: User UUID to follow

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Successfully followed user"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Cannot follow yourself
- 401: Unauthorized
- 404: User not found
- 409: Already following this user

---

#### 14. Unfollow User

**Endpoint**: `DELETE /api/v1/users/:id/follow`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: User UUID to unfollow

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Successfully unfollowed user"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Not following this user

---

#### 15. Get Follow Status

**Endpoint**: `GET /api/v1/users/:id/follow-status`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "isFollowedBy": false
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

---

#### 16. Get User Followers

**Endpoint**: `GET /api/v1/users/:id/followers`  
**Authentication**: None  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: User UUID

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": "uuid",
        "username": "follower_username",
        "displayName": "Follower Name",
        "avatarUrl": "https://example.com/avatar.jpg",
        "verified": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

---

#### 17. Get User Following

**Endpoint**: `GET /api/v1/users/:id/following`  
**Authentication**: None  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: User UUID

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response** (200 OK): Same structure as Get User Followers

---

### Admin Endpoints

#### 18. Get All Users (Admin)

**Endpoint**: `GET /api/v1/admin/users`  
**Authentication**: Required (Bearer Token)  
**Authorization**: Admin role required  
**Rate Limited**: Yes

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "username": "username",
        "displayName": "Display Name",
        "bio": "User bio",
        "avatarUrl": "https://example.com/avatar.jpg",
        "verified": false,
        "createdAt": "2025-10-11T12:00:00.000Z",
        "updatedAt": "2025-10-11T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1000,
      "totalPages": 50
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (not admin)

---

## Post Service APIs

**Base URL**: `http://localhost:8082` (Development)  
**API Prefix**: `/api/v1`

### Post Endpoints

#### 1. Get All Posts

**Endpoint**: `GET /api/v1/posts`  
**Authentication**: Optional (Bearer Token)  
**Rate Limited**: No

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Results per page (default: 10, max: 100)

**Response** (200 OK):
```json
{
  "posts": [
    {
      "id": "uuid",
      "authorId": "uuid",
      "content": "Post content here",
      "eventId": null,
      "likeCount": 42,
      "commentCount": 5,
      "createdAt": "2025-10-11T12:00:00.000Z",
      "updatedAt": "2025-10-11T12:00:00.000Z",
      "author": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg",
        "verified": false,
        "lastSynced": "2025-10-11T12:00:00.000Z"
      },
      "isLiked": false
    }
  ],
  "page": 0,
  "size": 10,
  "totalPosts": 100,
  "totalPages": 10
}
```

---

#### 2. Create Post

**Endpoint**: `POST /api/v1/posts`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**Request Body**:
```json
{
  "content": "Post content here (max 280 characters)",
  "eventId": "uuid" // Optional
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "authorId": "uuid",
  "content": "Post content here",
  "eventId": null,
  "likeCount": 0,
  "commentCount": 0,
  "createdAt": "2025-10-11T12:00:00.000Z",
  "updatedAt": "2025-10-11T12:00:00.000Z",
  "author": {
    "id": "uuid",
    "username": "username",
    "displayName": "Display Name",
    "avatarUrl": "https://example.com/avatar.jpg",
    "verified": false,
    "lastSynced": "2025-10-11T12:00:00.000Z"
  },
  "isLiked": false
}
```

**Errors**:
- 400: Content is required or exceeds 280 characters
- 401: Unauthorized

---

#### 3. Get Post by ID

**Endpoint**: `GET /api/v1/posts/:id`  
**Authentication**: Optional (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `id`: Post UUID

**Response** (200 OK):
```json
{
  "id": "uuid",
  "authorId": "uuid",
  "content": "Post content here",
  "eventId": null,
  "likeCount": 42,
  "commentCount": 5,
  "createdAt": "2025-10-11T12:00:00.000Z",
  "updatedAt": "2025-10-11T12:00:00.000Z",
  "author": {
    "id": "uuid",
    "username": "username",
    "displayName": "Display Name",
    "avatarUrl": "https://example.com/avatar.jpg",
    "verified": false,
    "lastSynced": "2025-10-11T12:00:00.000Z"
  },
  "isLiked": false
}
```

**Errors**:
- 400: Invalid post ID format
- 404: Post not found

---

#### 4. Get Posts by Author

**Endpoint**: `GET /api/v1/posts/author/:authorId`  
**Authentication**: Optional (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `authorId`: Author UUID

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Results per page (default: 10, max: 100)

**Response** (200 OK): Same structure as Get All Posts

**Errors**:
- 400: Invalid author ID format

---

#### 5. Delete Post

**Endpoint**: `DELETE /api/v1/posts/:id`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No  
**Authorization**: User can only delete their own posts

**URL Parameters**:
- `id`: Post UUID

**Response** (204 No Content): Empty body

**Errors**:
- 400: Invalid post ID format
- 401: Unauthorized
- 403: Forbidden (not the post author)
- 404: Post not found

---

#### 6. Like Post

**Endpoint**: `POST /api/v1/posts/:id/like`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `id`: Post UUID

**Response** (204 No Content): Empty body

**Errors**:
- 400: Invalid post ID format
- 401: Unauthorized
- 404: Post not found

---

#### 7. Unlike Post

**Endpoint**: `DELETE /api/v1/posts/:id/like`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `id`: Post UUID

**Response** (204 No Content): Empty body

**Errors**:
- 400: Invalid post ID format
- 401: Unauthorized
- 404: Like not found

---

## Messaging Service APIs

**Base URL**: `http://localhost:8083` (Development)  
**API Prefix**: `/api`

### WebSocket Connection

#### WebSocket Endpoint

**Endpoint**: `GET /ws`  
**Authentication**: Required (Query Parameter Token)  
**Protocol**: WebSocket

**Connection URL**:
```
ws://localhost:8083/ws?token=<jwt_token>
```

**Connection Flow**:
1. Client connects with JWT token in query parameter
2. Server validates token and upgrades to WebSocket
3. Server sends authentication confirmation message
4. Client can now send/receive messages in real-time

**WebSocket Message Types**:

**1. Authentication Confirmation** (Server → Client):
```json
{
  "type": "AUTHENTICATED",
  "payload": {
    "user_id": "uuid",
    "connected": true
  }
}
```

**2. New Message** (Server → Client):
```json
{
  "type": "MESSAGE",
  "payload": {
    "id": "mongodb_id",
    "conversation_id": "mongodb_id",
    "sender_id": "uuid",
    "content": "Message content",
    "message_type": "TEXT",
    "mentions": [],
    "created_at": "2025-10-11T12:00:00.000Z",
    "delivery_status": {
      "read_by": []
    }
  }
}
```

**3. Typing Indicator** (Client → Server / Server → Client):
```json
{
  "type": "TYPING",
  "payload": {
    "conversation_id": "mongodb_id",
    "is_typing": true
  }
}
```

---

### Message Endpoints

#### 1. Create Message

**Endpoint**: `POST /api/messages`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**Request Body**:
```json
{
  "conversation_id": "mongodb_id",
  "content": "Message content (1-5000 characters)",
  "mentions": ["user_id_1", "user_id_2"] // Optional
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "mongodb_id",
    "conversation_id": "mongodb_id",
    "sender_id": "uuid",
    "content": "Message content",
    "message_type": "TEXT",
    "mentions": [],
    "created_at": "2025-10-11T12:00:00.000Z",
    "delivery_status": {
      "read_by": []
    }
  }
}
```

**Errors**:
- 400: Validation error (content required, length limits)
- 401: Unauthorized

---

#### 2. Mark Message as Read

**Endpoint**: `PUT /api/messages/:id/read`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `id`: Message ID (MongoDB ObjectID)

**Response** (200 OK):
```json
{
  "message": "Message marked as read"
}
```

**Errors**:
- 400: Message ID required
- 401: Unauthorized

---

#### 3. Get Conversation Messages

**Endpoint**: `GET /api/messages/conversations/:id/messages`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `id`: Conversation ID (MongoDB ObjectID)

**Query Parameters**:
- `limit`: Number of messages (default: 50)
- `offset`: Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "mongodb_id",
      "conversation_id": "mongodb_id",
      "sender_id": "uuid",
      "content": "Message content",
      "message_type": "TEXT",
      "mentions": [],
      "created_at": "2025-10-11T12:00:00.000Z",
      "delivery_status": {
        "read_by": [
          {
            "user_id": "uuid",
            "read_at": "2025-10-11T12:00:00.000Z"
          }
        ]
      }
    }
  ],
  "count": 20
}
```

**Errors**:
- 400: Conversation ID required
- 401: Unauthorized

---

### Conversation Endpoints

#### 4. Get User Conversations

**Endpoint**: `GET /api/messages/conversations`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**Query Parameters**:
- `limit`: Number of conversations (default: 50)
- `offset`: Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "mongodb_id",
      "type": "DIRECT",
      "participants": ["user_id_1", "user_id_2"],
      "name": "Group Name", // Only for GROUP type
      "last_message": {
        "content": "Last message content",
        "sender_id": "uuid",
        "timestamp": "2025-10-11T12:00:00.000Z"
      },
      "created_at": "2025-10-11T12:00:00.000Z",
      "updated_at": "2025-10-11T12:00:00.000Z"
    }
  ],
  "count": 10
}
```

**Errors**:
- 401: Unauthorized

---

#### 5. Get Conversation by ID

**Endpoint**: `GET /api/messages/conversations/:id`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `id`: Conversation ID (MongoDB ObjectID)

**Response** (200 OK):
```json
{
  "data": {
    "id": "mongodb_id",
    "type": "DIRECT",
    "participants": ["user_id_1", "user_id_2"],
    "name": "Group Name",
    "last_message": {
      "content": "Last message content",
      "sender_id": "uuid",
      "timestamp": "2025-10-11T12:00:00.000Z"
    },
    "created_at": "2025-10-11T12:00:00.000Z",
    "updated_at": "2025-10-11T12:00:00.000Z"
  }
}
```

**Errors**:
- 400: Conversation ID required
- 401: Unauthorized
- 404: Conversation not found

---

#### 6. Create Group Conversation

**Endpoint**: `POST /api/messages/group`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**Request Body**:
```json
{
  "name": "Group Name (1-100 characters)",
  "participants": ["user_id_1", "user_id_2"] // Minimum 2 participants
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "mongodb_id",
    "type": "GROUP",
    "participants": ["current_user_id", "user_id_1", "user_id_2"],
    "name": "Group Name",
    "last_message": null,
    "created_at": "2025-10-11T12:00:00.000Z",
    "updated_at": "2025-10-11T12:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error (name required, minimum participants)
- 401: Unauthorized

---

## Notification Service APIs

**Base URL**: `http://localhost:8086` (Development)  
**API Prefix**: `/api/notifications`

### Notification Endpoints

#### 1. Get User Notifications

**Endpoint**: `GET /api/notifications`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Query Parameters**:
- `page`: Page number (default: 1, minimum: 1)
- `limit`: Results per page (default: 20, min: 1, max: 100)
- `type`: Filter by notification type (optional)
  - Types: `FOLLOW`, `LIKE`, `COMMENT`, `EVENT_INVITE`, `EVENT_RSVP`, `POST_MENTION`, `SYSTEM`, `MESSAGE`, `POST_SHARE`, `EVENT_REMINDER`, `FRIEND_REQUEST`, `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `SECURITY_ALERT`
- `unread_only`: Boolean, show only unread (default: false)
- `sort`: Sort order by creation date: `asc` or `desc` (default: desc)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "mongodb_id",
        "recipient_id": "user_id",
        "sender_id": "sender_user_id",
        "type": "FOLLOW",
        "title": "New Follower",
        "message": "@username started following you",
        "reference_id": "related_object_id",
        "reference_type": "USER",
        "is_read": false,
        "read_at": null,
        "priority": "MEDIUM",
        "metadata": {},
        "created_at": "2025-10-11T12:00:00.000Z",
        "updated_at": "2025-10-11T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 429: Rate limit exceeded

---

#### 2. Create Notification (Test Only)

**Endpoint**: `POST /api/notifications`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Request Body**:
```json
{
  "recipient_id": "user_id",
  "sender_id": "sender_user_id", // Optional
  "type": "FOLLOW",
  "title": "Notification Title",
  "message": "Notification message",
  "reference_id": "related_object_id", // Optional
  "reference_type": "USER", // Optional: POST, EVENT, USER, MESSAGE, COMMENT
  "priority": "MEDIUM", // Optional: LOW, MEDIUM, HIGH, URGENT
  "metadata": {} // Optional: Additional data
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "notification": {
      "_id": "mongodb_id",
      "recipient_id": "user_id",
      "sender_id": "sender_user_id",
      "type": "FOLLOW",
      "title": "Notification Title",
      "message": "Notification message",
      "reference_id": "related_object_id",
      "reference_type": "USER",
      "is_read": false,
      "read_at": null,
      "priority": "MEDIUM",
      "metadata": {},
      "created_at": "2025-10-11T12:00:00.000Z",
      "updated_at": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized

---

#### 3. Get Unread Notification Count

**Endpoint**: `GET /api/notifications/unread-count`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

#### 4. Get Notification Statistics

**Endpoint**: `GET /api/notifications/stats`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 100,
    "unread": 5,
    "read": 95,
    "typeBreakdown": {
      "FOLLOW": {
        "unread": 2,
        "read": 20
      },
      "LIKE": {
        "unread": 3,
        "read": 50
      }
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

#### 5. Mark Notification as Read

**Endpoint**: `PUT /api/notifications/:id/read`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: Notification ID (MongoDB ObjectID, 24 hex characters)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Notification marked as read",
    "notification": {
      "_id": "mongodb_id",
      "is_read": true,
      "read_at": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Notification not found

---

#### 6. Mark All Notifications as Read

**Endpoint**: `PUT /api/notifications/read-all`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "modified_count": 10,
    "message": "10 notifications marked as read"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

#### 7. Delete Notification

**Endpoint**: `DELETE /api/notifications/:id`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `id`: Notification ID (MongoDB ObjectID)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Notification deleted successfully"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Notification not found

---

#### 8. Cleanup Old Notifications

**Endpoint**: `DELETE /api/notifications/cleanup`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Query Parameters**:
- `days_old`: Number of days old notifications to delete (default: 30, min: 1, max: 365)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deleted_count": 50,
    "message": "50 old notifications cleaned up"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

### Notification Preferences Endpoints

#### 9. Get Notification Preferences

**Endpoint**: `GET /api/notifications/preferences`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user_id": "user_id",
    "email_notifications": true,
    "push_notifications": true,
    "in_app_notifications": true,
    "quiet_hours": {
      "enabled": true,
      "start_time": "22:00",
      "end_time": "08:00",
      "timezone": "UTC"
    },
    "preferences": {
      "FOLLOW": {
        "email": true,
        "push": true,
        "in_app": true
      },
      "LIKE": {
        "email": false,
        "push": true,
        "in_app": true
      }
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

#### 10. Update Notification Preferences

**Endpoint**: `PUT /api/notifications/preferences`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes (Stricter limits)

**Request Body**:
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "in_app_notifications": true,
  "quiet_hours": {
    "enabled": true,
    "start_time": "22:00",
    "end_time": "08:00",
    "timezone": "UTC"
  },
  "preferences": {
    "FOLLOW": {
      "email": true,
      "push": true,
      "in_app": true
    },
    "LIKE": {
      "email": false,
      "push": true,
      "in_app": true
    }
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Notification preferences updated successfully",
    "preferences": {
      // Updated preferences object
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 429: Rate limit exceeded

---

## Social Service APIs

**Base URL**: `http://localhost:8085` (Development)  
**API Prefix**: `/api/v1/social`

### Social Relationship Endpoints

#### 1. Follow User

**Endpoint**: `POST /api/v1/social/follow/:userId`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `userId`: User UUID to follow

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Successfully followed user",
    "follow": {
      "id": "uuid",
      "followerId": "current_user_id",
      "followingId": "followed_user_id",
      "createdAt": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Cannot follow yourself
- 401: Unauthorized
- 409: Already following this user

---

#### 2. Unfollow User

**Endpoint**: `DELETE /api/v1/social/follow/:userId`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `userId`: User UUID to unfollow

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Successfully unfollowed user"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Not following this user

---

#### 3. Get User Followers

**Endpoint**: `GET /api/v1/social/followers/:userId`  
**Authentication**: None  
**Rate Limited**: No

**URL Parameters**:
- `userId`: User UUID

**Query Parameters**:
- `page`: Page number (default: 1, minimum: 1)
- `limit`: Results per page (default: 20, min: 1, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg",
        "verified": false,
        "followedAt": "2025-10-11T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Invalid user ID format

---

#### 4. Get User Following

**Endpoint**: `GET /api/v1/social/following/:userId`  
**Authentication**: None  
**Rate Limited**: No

**URL Parameters**:
- `userId`: User UUID

**Query Parameters**:
- `page`: Page number (default: 1, minimum: 1)
- `limit`: Results per page (default: 20, min: 1, max: 100)

**Response** (200 OK): Same structure as Get User Followers

---

#### 5. Block User

**Endpoint**: `POST /api/v1/social/block/:userId`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `userId`: User UUID to block

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Successfully blocked user",
    "block": {
      "id": "uuid",
      "blockerId": "current_user_id",
      "blockedId": "blocked_user_id",
      "createdAt": "2025-10-11T12:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Cannot block yourself
- 401: Unauthorized
- 409: Already blocked this user

---

#### 6. Unblock User

**Endpoint**: `DELETE /api/v1/social/block/:userId`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: Yes

**URL Parameters**:
- `userId`: User UUID to unblock

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Successfully unblocked user"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: User not blocked

---

#### 7. Get User Recommendations

**Endpoint**: `GET /api/v1/social/recommendations`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**Query Parameters**:
- `limit`: Number of recommendations (default: 10, min: 1, max: 50)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg",
        "verified": false,
        "mutualFollowersCount": 5
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

#### 8. Get Social Statistics

**Endpoint**: `GET /api/v1/social/stats/:userId`  
**Authentication**: None  
**Rate Limited**: No

**URL Parameters**:
- `userId`: User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "followersCount": 1000,
    "followingCount": 500,
    "postsCount": 250,
    "updatedAt": "2025-10-11T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 400: Invalid user ID format

---

#### 9. Get Follow Status

**Endpoint**: `GET /api/v1/social/status/:userId`  
**Authentication**: Required (Bearer Token)  
**Rate Limited**: No

**URL Parameters**:
- `userId`: User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "isFollowing": true,
    "isFollowedBy": false,
    "isBlocked": false,
    "isBlockedBy": false
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

**Errors**:
- 401: Unauthorized

---

## Health Check Endpoints

All services provide health check endpoints for monitoring:

### Health Check

**Endpoint**: `GET /health`  
**Authentication**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "pulse-{service-name}",
    "version": "1.0.0",
    "timestamp": "2025-10-11T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

### Readiness Check (Some Services)

**Endpoint**: `GET /ready`  
**Authentication**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "ready": true,
    "service": "pulse-{service-name}",
    "timestamp": "2025-10-11T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

---

## Rate Limiting

Most endpoints implement rate limiting. When the rate limit is exceeded, you'll receive:

**Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  },
  "meta": {
    "timestamp": "2025-10-11T12:00:00.000Z",
    "version": "v1"
  }
}
```

---

## Service Ports (Development)

| Service | Port | Base URL |
|---------|------|----------|
| User Service | 8080 | http://localhost:8080 |
| Post Service | 8082 | http://localhost:8082 |
| Messaging Service | 8083 | http://localhost:8083 |
| Social Service | 8085 | http://localhost:8085 |
| Notification Service | 8086 | http://localhost:8086 |

---

## Notes for Frontend Implementation

### 1. Authentication Flow
- Use `/api/v1/auth/login` to get access and refresh tokens
- Store tokens securely (use httpOnly cookies or secure storage)
- Include access token in Authorization header for protected endpoints
- Implement token refresh logic when access token expires
- Handle 401 errors by refreshing token or redirecting to login

### 2. WebSocket Connection (Messaging)
- Establish WebSocket connection after user login
- Pass JWT token as query parameter
- Listen for different message types (AUTHENTICATED, MESSAGE, TYPING)
- Implement reconnection logic for dropped connections
- Send typing indicators when user is typing

### 3. Real-time Updates
- Use WebSocket for real-time messaging
- Consider polling for notifications (or implement WebSocket for notifications)
- Update UI immediately after mutations (optimistic updates)
- Implement proper error handling and rollback for failed mutations

### 4. Pagination
- Implement infinite scroll or "Load More" for paginated endpoints
- Keep track of current page/offset
- Handle edge cases (empty results, last page)

### 5. Error Handling
- Check `success` field in all responses
- Display user-friendly error messages from `error.message`
- Handle network errors gracefully
- Implement retry logic for failed requests

### 6. Data Validation
- Validate data on client-side before sending to API
- Follow character limits (e.g., 280 for posts, 5000 for messages)
- Validate email and username formats
- Check required fields

### 7. Performance Optimization
- Cache user data locally
- Debounce search inputs
- Implement optimistic UI updates
- Use pagination for large lists
- Lazy load images and components

### 8. Security Considerations
- Never store sensitive data in localStorage
- Validate all user inputs
- Use HTTPS in production
- Implement CSRF protection if needed
- Handle token expiration gracefully

