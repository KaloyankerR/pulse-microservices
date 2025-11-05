-- Migration script to split user database into auth and user databases
-- This script should be run AFTER creating the new auth and user databases
-- Run this script on the original user-service database first to extract data

-- Backup script (run this first to create a backup)
-- pg_dump -U pulse_user -d pulse_user_service_db > backup_before_split.sql

-- ============================================
-- STEP 1: Extract data to auth database
-- ============================================
-- Connect to auth database (pulse_auth_db) and run:

-- Create users table in auth database (from User model)
-- id, email, passwordHash, createdAt, updatedAt
INSERT INTO auth_service.users (id, email, password_hash, created_at, updated_at)
SELECT id, email, password_hash, created_at, updated_at
FROM user_service.users;

-- Migrate UserSession to auth database
INSERT INTO auth_service.user_sessions (id, user_id, token_hash, expires_at, created_at)
SELECT id, user_id, token_hash, expires_at, created_at
FROM user_service.user_sessions;

-- ============================================
-- STEP 2: Extract data to user database  
-- ============================================
-- Connect to user database (pulse_user_db) and run:

-- Create user_profiles table (from UserProfile model)
-- id, username, displayName, bio, avatarUrl, verified, createdAt, updatedAt
INSERT INTO user_service.user_profiles (id, username, display_name, bio, avatar_url, verified, created_at, updated_at)
SELECT id, username, display_name, bio, avatar_url, verified, created_at, updated_at
FROM user_service.users;

-- Migrate UserFollow (stays in user database)
-- No migration needed - this table stays in user database
-- user_follows table already exists in user database

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify user count matches
-- SELECT COUNT(*) FROM auth_service.users; -- Should match
-- SELECT COUNT(*) FROM user_service.user_profiles; -- Should match

-- Verify session count matches
-- SELECT COUNT(*) FROM auth_service.user_sessions; -- Should match original

-- Verify follows are intact
-- SELECT COUNT(*) FROM user_service.user_follows; -- Should match original

-- ============================================
-- NOTES
-- ============================================
-- 1. User IDs must be consistent across both databases (same UUIDs)
-- 2. Run this script during a maintenance window
-- 3. After migration, update application configs to use new databases
-- 4. Keep original database until verification is complete
-- 5. This assumes table names are:
--    - Original: users, user_sessions, user_follows
--    - Auth DB: users, user_sessions
--    - User DB: user_profiles, user_follows







