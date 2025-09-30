-- Pulse Post Service Database Initialization (Go Service)
-- Following DATABASE&SCHEMAS.md specifications

-- Create posts table following DATABASE&SCHEMAS.md
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (length(content) <= 280),
    event_id UUID, -- Reference to Event Service
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create post_likes table following DATABASE&SCHEMAS.md
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create user_cache table following DATABASE&SCHEMAS.md
CREATE TABLE IF NOT EXISTS user_cache (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    last_synced TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization following DATABASE&SCHEMAS.md
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_event ON posts(event_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cache_username ON user_cache(username);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_cache_updated_at BEFORE UPDATE ON user_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update like count
CREATE TRIGGER update_like_count_trigger
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Insert sample data for testing
INSERT INTO user_cache (id, username, display_name, avatar_url, verified) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'testuser', 'Test User', 'https://example.com/avatar1.jpg', true),
    ('123e4567-e89b-12d3-a456-426614174001', 'johndoe', 'John Doe', 'https://example.com/avatar2.jpg', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (id, author_id, content, like_count, comment_count) VALUES
    ('223e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', 'Welcome to Pulse Go Service! This is my first post. 🎉', 5, 2),
    ('223e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174001', 'Just had an amazing day at the beach! 🌊', 12, 3)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE pulse_posts TO pulse_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse_user;
