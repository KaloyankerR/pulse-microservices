-- Backup script for user-service database before migration
-- Run this BEFORE starting the migration process

-- ============================================
-- Option 1: Using pg_dump (Recommended)
-- ============================================
-- pg_dump -U pulse_user -d pulse_user_service_db -F c -f backup_user_service_$(date +%Y%m%d_%H%M%S).dump
-- Or plain SQL format:
-- pg_dump -U pulse_user -d pulse_user_service_db > backup_user_service_$(date +%Y%m%d_%H%M%S).sql

-- ============================================
-- Option 2: Using SQL (Manual backup)
-- ============================================

-- Backup users table
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' WITH CSV HEADER;

-- Backup user_sessions table
COPY (SELECT * FROM user_sessions) TO '/tmp/user_sessions_backup.csv' WITH CSV HEADER;

-- Backup user_follows table
COPY (SELECT * FROM user_follows) TO '/tmp/user_follows_backup.csv' WITH CSV HEADER;

-- ============================================
-- Option 3: Create backup tables
-- ============================================

CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS user_sessions_backup AS SELECT * FROM user_sessions;
CREATE TABLE IF NOT EXISTS user_follows_backup AS SELECT * FROM user_follows;

-- ============================================
-- Verification
-- ============================================

-- Verify backup table counts match originals
SELECT 
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM users_backup) as backup_users_count,
    (SELECT COUNT(*) FROM user_sessions) as sessions_count,
    (SELECT COUNT(*) FROM user_sessions_backup) as backup_sessions_count,
    (SELECT COUNT(*) FROM user_follows) as follows_count,
    (SELECT COUNT(*) FROM user_follows_backup) as backup_follows_count;

-- ============================================
-- NOTES
-- ============================================
-- 1. Run this during a maintenance window
-- 2. Verify backup file sizes are reasonable
-- 3. Store backups in a safe location
-- 4. Document backup location and timestamp
-- 5. Test restore procedure in staging environment







