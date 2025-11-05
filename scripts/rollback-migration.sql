-- Rollback script to revert database split
-- Use this if migration fails and you need to restore original state

-- ============================================
-- STEP 1: Restore from backup
-- ============================================
-- If you have a backup, restore it:
-- psql -U pulse_user -d pulse_user_service_db < backup_before_split.sql

-- ============================================
-- STEP 2: Alternative - Merge data back
-- ============================================
-- If you need to merge data back into original structure:

-- Restore original users table structure
-- This assumes you want to merge auth.users and user.user_profiles back

-- Connect to original user_service database
-- First, recreate users table with all fields if it was dropped:

CREATE TABLE IF NOT EXISTS users_backup AS
SELECT 
    a.id,
    a.email,
    a.password_hash as passwordHash,
    u.username,
    u.display_name as displayName,
    u.bio,
    u.avatar_url as avatarUrl,
    u.verified,
    COALESCE(a.created_at, u.created_at) as created_at,
    COALESCE(a.updated_at, u.updated_at) as updated_at
FROM auth_service.users a
FULL OUTER JOIN user_service.user_profiles u ON a.id = u.id;

-- Restore sessions
CREATE TABLE IF NOT EXISTS user_sessions_backup AS
SELECT * FROM auth_service.user_sessions;

-- ============================================
-- NOTES
-- ============================================
-- 1. This is a template - adjust table names based on your actual schema
-- 2. Always have a backup before running migrations
-- 3. Test rollback in staging environment first
-- 4. Verify data integrity after rollback




