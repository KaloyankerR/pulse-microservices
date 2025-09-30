-- Social Service Database Initialization Script
-- This script is automatically run when the PostgreSQL container is first created

-- Create database if not exists
SELECT 'CREATE DATABASE pulse_social_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pulse_social_db')\gexec

-- Connect to the database
\c pulse_social_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Tables will be created by Prisma migrations
-- This script just ensures the database exists and UUID extension is enabled

