# Events Feature Implementation

## Overview

This document describes the Events feature implementation for the Twitter clone application. The feature allows users to create events and RSVP to them.

## Database Schema

### Event Model

```prisma
model Event {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  title         String
  description   String?
  eventDate     DateTime
  location      String?
  maxAttendees  Int?
  visibility    String   @default("public") // "public" or "private"
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String   @db.ObjectId

  user     User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  rsvps    EventRSVP[]
}
```

### EventRSVP Model

```prisma
model EventRSVP {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  status      String   // "going", "maybe", "not_going"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String   @db.ObjectId
  eventId     String   @db.ObjectId

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
}
```

## API Endpoints

### Events

- `GET /api/events` - List events with pagination
- `POST /api/events` - Create new event
- `GET /api/events/[eventId]` - Get specific event details
- `PUT /api/events/[eventId]` - Update event (creator only)
- `DELETE /api/events/[eventId]` - Delete event (creator only)

### RSVP

- `POST /api/events/[eventId]/rsvp` - RSVP to event
- `GET /api/events/[eventId]/attendees` - Get event attendees (creator only)

## Frontend Components

### Core Components

- `EventCard` - Displays event information and RSVP buttons
- `CreateEventForm` - Form for creating new events
- `EventFeed` - Lists events with pagination
- `EventDetailsPage` - Detailed event view
- `CombinedFeed` - Shows both posts and events in timeline

### Hooks

- `useEvents` - Fetch events data
- `useEvent` - Fetch single event data
- `useRSVP` - Handle RSVP functionality

## Features

### Event Creation

- Required fields: title, event date
- Optional fields: description, location, max attendees, visibility, image
- Date validation (must be in future)
- Character limits: title (100), description (500), location (200)

### RSVP System

- Three states: "Going", "Maybe", "Not Going"
- Real-time count updates
- Event capacity enforcement
- Users can change RSVP status anytime

### Event Display

- Events appear in main feed alongside posts
- Dedicated events page at `/events`
- Individual event pages at `/events/[eventId]`
- Chronological ordering (upcoming events first)

### Authorization

- Users can only edit/delete their own events
- Event creators can view attendee lists
- Public events visible to all users
- Private events visible to followers only

## Usage

### Creating an Event

1. Navigate to `/events` or use the sidebar
2. Click "Create Event" button
3. Fill in event details
4. Submit form

### RSVP to Event

1. View event in feed or event details page
2. Click RSVP button (Going/Maybe/Not Going)
3. Status updates immediately

### Viewing Events

- Main feed shows combined posts and events
- Events page shows all events
- Event details page shows full information and RSVP options

## Technical Notes

### Database

- Uses MongoDB with Prisma ORM
- Unique constraint on user-event RSVP pairs
- Cascade delete for user/event relationships

### Frontend

- Built with Next.js, React, TypeScript
- Styled with Tailwind CSS
- State management with SWR for data fetching
- Real-time updates with optimistic UI

### API

- RESTful endpoints following existing patterns
- Authentication required for all operations
- Proper error handling and validation
- Pagination support for large datasets

## Future Enhancements

- Event image upload
- Event notifications
- Event categories/tags
- Event search and filtering
- Event sharing
- Recurring events
- Event reminders
- Attendee messaging
