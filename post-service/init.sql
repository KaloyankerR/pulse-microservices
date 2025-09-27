-- Initialize Post Service Database
-- This script sets up the initial database structure and configurations
-- Aligned with DATABASE&SCHEMAS.md specification

-- Connect to the database
\c pulse_posts;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS user_cache CASCADE;

-- Create user_cache table (lightweight user cache for post service)
CREATE TABLE user_cache (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    last_synced TIMESTAMP DEFAULT NOW()
);

-- Create posts table (aligned with DATABASE&SCHEMAS.md)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (length(content) <= 280),
    event_id UUID, -- Reference to Event Service
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create post_likes table (aligned with DATABASE&SCHEMAS.md)
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for better performance (aligned with DATABASE&SCHEMAS.md)
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_event_id ON posts(event_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Create full-text search index for post content
CREATE INDEX idx_posts_content_fts ON posts USING gin(to_tsvector('english', content));

-- Create trigram index for partial text matching
CREATE INDEX idx_posts_content_trgm ON posts USING gin(content gin_trgm_ops);

-- Create index on user_cache for efficient lookups
CREATE INDEX idx_user_cache_username ON user_cache(username);
CREATE INDEX idx_user_cache_last_synced ON user_cache(last_synced);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE pulse_posts TO pulse_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pulse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pulse_user;
