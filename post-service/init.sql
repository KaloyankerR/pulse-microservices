-- Initialize Post Service Database
-- This script sets up the initial database structure and configurations

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE pulse_posts_service_db;

-- Connect to the database
\c pulse_posts_service_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('PUBLISHED', 'DRAFT', 'HIDDEN', 'PENDING_MODERATION', 'REMOVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE comment_status AS ENUM ('PUBLISHED', 'HIDDEN', 'PENDING_MODERATION', 'REMOVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables (these will be created by JPA, but we can add custom indexes)

-- Create indexes for better performance
-- These will be created after JPA creates the tables

-- Create full-text search index
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_fts 
-- ON posts USING gin(to_tsvector('english', content));

-- Create trigram index for partial text matching
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_trgm 
-- ON posts USING gin(content gin_trgm_ops);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE pulse_posts_service_db TO pulse_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pulse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pulse_user;
