# Chat Feature Implementation

## Overview

This document describes the Chat feature implementation for the Pulse application. The feature allows users to send direct messages (DMs) to each other.

## Database Schema

### Chat Model

```prisma
model Chat {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userIds   String[] @db.ObjectId

  messages Message[]
}
```

### Message Model

```prisma
model Message {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String   @db.ObjectId
  chatId    String   @db.ObjectId
  readBy    String[] @db.ObjectId

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  chat Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Chats

- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create a new chat with another user

### Messages

- `GET /api/chats/[chatId]/messages` - Get messages for a specific chat
- `POST /api/chats/[chatId]/messages` - Send a message to a chat
- `POST /api/chats/[chatId]/read` - Mark messages as read

## Frontend Components

### Core Components

- `ChatModal` - Modal for starting new conversations
- `ChatList` - List of user's conversations
- `MessageList` - Display messages in a conversation
- `MessageInput` - Input field for sending messages
- `ChatWindow` - Main chat interface combining all components

### Hooks

- `useChats` - Fetch and manage user's chats
- `useMessages` - Fetch and manage messages for a specific chat
- `useChatModal` - Manage chat modal state

## Features

### Current Features

1. **Start Conversations**: Users can start new conversations by clicking the "Message" button on user profiles
2. **View Conversations**: Users can see all their conversations in the chat list
3. **Send Messages**: Users can send text messages up to 1000 characters
4. **Real-time Updates**: Messages are updated in real-time using SWR
5. **Message History**: Users can see the full conversation history
6. **Read Status**: Messages can be marked as read (basic implementation)

### UI Integration

1. **Sidebar**: Added "Messages" link in the sidebar that navigates to `/chat`
2. **User Profiles**: Added "Message" button on user profiles to start conversations
3. **Global Modal**: Chat modal is available globally for starting new conversations

## Usage

### Starting a Conversation

1. Navigate to any user's profile
2. Click the "Message" button
3. Type your message and send

### Accessing Chat

1. Click "Messages" in the sidebar
2. Select a conversation from the list
3. View and send messages

## Technical Details

### Database Design

- Uses MongoDB with Prisma
- Chats store user IDs in an array for easy querying
- Messages include read status tracking
- Cascade deletion ensures data consistency

### State Management

- Uses Zustand for modal state management
- SWR for data fetching and caching
- Real-time updates through SWR revalidation

### Security

- All API routes require authentication
- Users can only access chats they're part of
- Input validation and sanitization

## Future Enhancements

1. **Real-time Messaging**: Implement WebSocket or Server-Sent Events for real-time messaging
2. **Message Types**: Support for images, files, and other media
3. **Group Chats**: Allow multiple users in a single conversation
4. **Message Reactions**: Add emoji reactions to messages
5. **Message Search**: Search through conversation history
6. **Push Notifications**: Notify users of new messages
7. **Message Encryption**: End-to-end encryption for privacy
8. **Typing Indicators**: Show when users are typing
9. **Message Status**: More detailed read receipts (sent, delivered, read)
10. **Chat Settings**: Mute notifications, block users, etc.
