#!/bin/bash

# Pulse Microservices Database Reset Script
# This script creates or resets all databases for the Pulse microservices

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_ADMIN_USER=${POSTGRES_ADMIN_USER:-kalo}
POSTGRES_USER=${POSTGRES_USER:-pulse_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-pulse_user}

# MongoDB configuration
MONGO_HOST=${MONGO_HOST:-localhost}
MONGO_PORT=${MONGO_PORT:-27017}

# Database names
USER_DB="pulse_users"
SOCIAL_DB="pulse_social"
POST_DB="pulse_posts"
EVENT_DB="pulse_events"
NOTIFICATION_DB="pulse_notifications"
MESSAGING_DB="pulse_messaging"

echo -e "${BLUE}🚀 Pulse Microservices Database Reset Script${NC}"
echo "=================================================="

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${YELLOW}📡 Checking PostgreSQL connection...${NC}"
    if ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER > /dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
        echo "Please ensure PostgreSQL is running on $POSTGRES_HOST:$POSTGRES_PORT"
        exit 1
    fi
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
}

# Function to check if MongoDB is running
check_mongo() {
    echo -e "${YELLOW}📡 Checking MongoDB connection...${NC}"
    if ! mongosh --host $MONGO_HOST:$MONGO_PORT --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${RED}❌ MongoDB is not running or not accessible${NC}"
        echo "Please ensure MongoDB is running on $MONGO_HOST:$MONGO_PORT"
        exit 1
    fi
    echo -e "${GREEN}✅ MongoDB is running${NC}"
}

# Function to create PostgreSQL database
create_postgres_db() {
    local db_name=$1
    local description=$2
    
    echo -e "${YELLOW}🗄️  Creating PostgreSQL database: $db_name ($description)${NC}"
    
    # Check if database exists and terminate active connections
    echo -e "${YELLOW}🔍 Checking for existing database and active connections...${NC}"
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d postgres -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = '$db_name' AND pid <> pg_backend_pid();
    " 2>/dev/null || true
    
    # Drop database if it exists
    echo -e "${YELLOW}🗑️  Dropping existing database if it exists...${NC}"
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d postgres -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null || true
    
    # Create database
    echo -e "${YELLOW}🏗️  Creating new database...${NC}"
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d postgres -c "CREATE DATABASE $db_name;"
    
    # Grant permissions to pulse_user
    echo -e "${YELLOW}🔐 Granting permissions...${NC}"
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $POSTGRES_USER;"
    
    echo -e "${GREEN}✅ Database $db_name created successfully${NC}"
}

# Function to create MongoDB database
create_mongo_db() {
    local db_name=$1
    local description=$2
    
    echo -e "${YELLOW}🗄️  Creating MongoDB database: $db_name ($description)${NC}"
    
    # Drop database if it exists
    echo -e "${YELLOW}🗑️  Dropping existing database if it exists...${NC}"
    mongosh --host $MONGO_HOST:$MONGO_PORT $db_name --eval "db.dropDatabase()" > /dev/null 2>&1 || true
    
    # Create database by inserting and removing a document
    echo -e "${YELLOW}🏗️  Creating new database...${NC}"
    mongosh --host $MONGO_HOST:$MONGO_PORT $db_name --eval "db.temp.insertOne({created: new Date()}); db.temp.drop();" > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Database $db_name created successfully${NC}"
}

# Function to create PostgreSQL tables
create_postgres_tables() {
    local db_name=$1
    local description=$2
    
    echo -e "${YELLOW}📋 Creating tables in $db_name ($description)${NC}"
    
    case $db_name in
        $USER_DB)
            create_user_service_tables
            ;;
        $SOCIAL_DB)
            create_social_service_tables
            ;;
        $POST_DB)
            create_post_service_tables
            ;;
        $EVENT_DB)
            create_event_service_tables
            ;;
        $NOTIFICATION_DB)
            create_notification_service_tables
            ;;
        *)
            echo -e "${YELLOW}⚠️  Unknown database: $db_name, skipping table creation${NC}"
            ;;
    esac
    
    echo -e "${GREEN}✅ Tables created successfully for $db_name${NC}"
}

# Function to create User Service tables
create_user_service_tables() {
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d $USER_DB << 'EOF'
-- User Service Tables
CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
EOF
}

# Function to create Social Service tables
create_social_service_tables() {
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d $SOCIAL_DB << 'EOF'
-- Social Service Tables
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS user_social_stats (
    user_id UUID PRIMARY KEY,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);
EOF
}

# Function to create Post Service tables
create_post_service_tables() {
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d $POST_DB << 'EOF'
-- Post Service Tables
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (length(content) <= 280),
    event_id UUID, -- Reference to Event Service
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id),
    user_id UUID NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id),
    author_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (length(content) <= 280),
    parent_comment_id UUID REFERENCES comments(id),
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id),
    user_id UUID NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_event_id ON posts(event_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
EOF
}

# Function to create Event Service tables
create_event_service_tables() {
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d $EVENT_DB << 'EOF'
-- Event Service Tables
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'SOCIAL',
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    going_count INTEGER DEFAULT 0,
    interested_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id UUID NOT NULL REFERENCES events(id),
    user_id UUID NOT NULL,
    status VARCHAR(20) CHECK (status IN ('GOING', 'INTERESTED', 'MAYBE', 'NOT_GOING')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);
EOF
}

# Function to create Notification Service tables
create_notification_service_tables() {
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_ADMIN_USER -d $NOTIFICATION_DB << 'EOF'
-- Notification Service Tables
CREATE TABLE IF NOT EXISTS notifications (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) 
    WHERE is_read = FALSE;
EOF
}

# Function to create MongoDB collections
create_mongo_collections() {
    local db_name=$1
    
    echo -e "${YELLOW}📋 Creating collections in $db_name${NC}"
    
    case $db_name in
        $MESSAGING_DB)
            # Create conversations collection
            mongosh --host $MONGO_HOST:$MONGO_PORT $db_name --eval "
                db.conversations.createIndex({ 'participants': 1 });
                db.conversations.createIndex({ 'last_message.timestamp': -1 });
            "
            
            # Create messages collection
            mongosh --host $MONGO_HOST:$MONGO_PORT $db_name --eval "
                db.messages.createIndex({ 'conversation_id': 1, 'created_at': -1 });
                db.messages.createIndex({ 'sender_id': 1 });
            "
            
            # Create user presence collection
            mongosh --host $MONGO_HOST:$MONGO_PORT $db_name --eval "
                db.user_presence.createIndex({ 'user_id': 1 }, { unique: true });
            "
            ;;
    esac
    
    echo -e "${GREEN}✅ Collections and indexes created successfully${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting database reset process...${NC}"
    
    # Check database connections
    check_postgres
    check_mongo
    
    echo ""
    echo -e "${BLUE}📊 Creating PostgreSQL databases...${NC}"
    
    # Create PostgreSQL databases
    create_postgres_db $USER_DB "User Service"
    create_postgres_db $SOCIAL_DB "Social Service"
    create_postgres_db $POST_DB "Post Service"
    create_postgres_db $EVENT_DB "Event Service"
    create_postgres_db $NOTIFICATION_DB "Notification Service"
    
    echo ""
    echo -e "${BLUE}📊 Creating MongoDB databases...${NC}"
    
    # Create MongoDB databases
    create_mongo_db $MESSAGING_DB "Messaging Service"
    
    echo ""
    echo -e "${BLUE}📋 Creating database schemas...${NC}"
    
    # Create tables for each service
    create_postgres_tables $USER_DB "User Service"
    create_postgres_tables $SOCIAL_DB "Social Service"
    create_postgres_tables $POST_DB "Post Service"
    create_postgres_tables $EVENT_DB "Event Service"
    create_postgres_tables $NOTIFICATION_DB "Notification Service"
    
    # Create MongoDB collections
    create_mongo_collections $MESSAGING_DB
    
    echo ""
    echo -e "${GREEN}🎉 Database reset completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Created databases:${NC}"
    echo "  • PostgreSQL: $USER_DB, $SOCIAL_DB, $POST_DB, $EVENT_DB, $NOTIFICATION_DB"
    echo "  • MongoDB: $MESSAGING_DB"
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "  1. Run Prisma migrations in each service: npm run db:push"
    echo "  2. Seed initial data if needed: npm run db:seed"
    echo "  3. Start your services"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --postgres-only Create only PostgreSQL databases"
        echo "  --mongo-only   Create only MongoDB databases"
        echo ""
        echo "Environment variables:"
        echo "  POSTGRES_HOST     PostgreSQL host (default: localhost)"
        echo "  POSTGRES_PORT     PostgreSQL port (default: 5432)"
        echo "  POSTGRES_ADMIN_USER PostgreSQL admin user (default: kalo)"
        echo "  POSTGRES_USER     PostgreSQL app user (default: pulse_user)"
        echo "  POSTGRES_PASSWORD PostgreSQL app password (default: pulse_user)"
        echo "  MONGO_HOST        MongoDB host (default: localhost)"
        echo "  MONGO_PORT        MongoDB port (default: 27017)"
        exit 0
        ;;
    --postgres-only)
        check_postgres
        create_postgres_db $USER_DB "User Service"
        create_postgres_db $SOCIAL_DB "Social Service"
        create_postgres_db $POST_DB "Post Service"
        create_postgres_db $EVENT_DB "Event Service"
        create_postgres_db $NOTIFICATION_DB "Notification Service"
        
        echo ""
        echo -e "${BLUE}📋 Creating database schemas...${NC}"
        
        # Create tables for each service
        create_postgres_tables $USER_DB "User Service"
        create_postgres_tables $SOCIAL_DB "Social Service"
        create_postgres_tables $POST_DB "Post Service"
        create_postgres_tables $EVENT_DB "Event Service"
        create_postgres_tables $NOTIFICATION_DB "Notification Service"
        
        echo -e "${GREEN}🎉 PostgreSQL databases and tables created successfully!${NC}"
        ;;
    --mongo-only)
        check_mongo
        create_mongo_db $MESSAGING_DB "Messaging Service"
        create_mongo_collections $MESSAGING_DB
        echo -e "${GREEN}🎉 MongoDB databases created successfully!${NC}"
        ;;
    *)
        main
        ;;
esac
