# Database Design & Schema

## 🗄️ **Database Strategy**

### **Technology Choices**
- **PostgreSQL** (5 services): ACID transactions, complex queries, relationships
- **MongoDB** (1 service): Flexible documents, real-time messaging

### **Data Ownership Principle**
Each service owns its data completely. Other services maintain minimal cache copies synced via events.

---

## 📊 **Service Databases**

### **1. User Service (PostgreSQL)**
```sql
-- Core user authentication and profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```

### **2. Social Service (PostgreSQL)**
```sql
-- Follow relationships and social graph
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE user_social_stats (
    user_id UUID PRIMARY KEY,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0
);
```

### **3. Post Service (PostgreSQL)**
```sql
-- Posts, comments, and engagement
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (length(content) <= 280),
    event_id UUID, -- Reference to Event Service
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id),
    user_id UUID NOT NULL,
    UNIQUE(post_id, user_id)
);
```

### **4. Event Service (PostgreSQL)**
```sql
-- Events and RSVPs
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'SOCIAL',
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    going_count INTEGER DEFAULT 0,
    interested_count INTEGER DEFAULT 0
);

CREATE TABLE event_rsvps (
    event_id UUID NOT NULL REFERENCES events(id),
    user_id UUID NOT NULL,
    status VARCHAR(20) CHECK (status IN ('GOING', 'INTERESTED', 'MAYBE', 'NOT_GOING')),
    UNIQUE(event_id, user_id)
);
```

### **5. Messaging Service (MongoDB)**
```javascript
// Conversations collection
{
  _id: ObjectId,
  type: "DIRECT|GROUP",
  participants: ["user-uuid1", "user-uuid2"],
  name: "string", // Group name
  last_message: {
    content: "string",
    sender_id: "user-uuid",
    timestamp: Date
  },
  created_at: Date
}

// Messages collection
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: "user-uuid",
  content: "string",
  message_type: "TEXT|SYSTEM",
  mentions: ["user-uuid"],
  created_at: Date,
  delivery_status: {
    read_by: [{ user_id: "uuid", read_at: Date }]
  }
}
```

### **6. Notification Service (PostgreSQL)**
```sql
-- All user notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    sender_id UUID,
    type VARCHAR(50) NOT NULL, -- FOLLOW, LIKE, COMMENT, EVENT_INVITE
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID, -- Post ID, Event ID, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 **Data Synchronization**

### **User Cache Pattern**
Each service maintains a lightweight user cache:
```sql
CREATE TABLE user_cache (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    last_synced TIMESTAMP DEFAULT NOW()
);
```

### **Sync Triggers**
- User Service publishes `user.created` / `user.updated`
- All services update their `user_cache` tables
- Keeps user data eventually consistent

---

## 📈 **Performance Optimizations**

### **Strategic Indexing**
```sql
-- High-frequency queries
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) 
    WHERE is_read = FALSE;
```

### **Denormalized Counts**
- `like_count`, `comment_count` in posts table
- `followers_count`, `following_count` in social stats
- Updated via database triggers for consistency

### **MongoDB Indexes**
```javascript
// Messaging performance
db.messages.createIndex({ "conversation_id": 1, "created_at": -1 });
db.conversations.createIndex({ "participants": 1 });
db.user_presence.createIndex({ "user_id": 1 }, { unique: true });
```