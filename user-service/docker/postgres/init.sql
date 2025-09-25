-- Initialize the PostgreSQL database for Pulse User Service
-- This file is executed when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
CREATE DATABASE pulse_users;

-- Connect to the database
\c pulse_users;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create a user for the application (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pulse_user') THEN
        CREATE ROLE pulse_user LOGIN PASSWORD 'pulse_password';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE pulse_users TO pulse_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO pulse_user;

-- Note: Tables will be created by Prisma migrations
