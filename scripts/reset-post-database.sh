#!/bin/bash

# Reset Post Service Database Script
# This script drops and recreates the pulse_posts database with the correct schema
# Aligned with DATABASE&SCHEMAS.md specification

set -e

echo "🔄 Resetting Post Service Database..."

# Database configuration
DB_NAME="pulse_posts"
DB_USER="pulse_user"
DB_PASSWORD="pulse_user"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Database Configuration:${NC}"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running on $DB_HOST:$DB_PORT${NC}"
    echo "Please start PostgreSQL and try again."
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Drop and recreate database
echo -e "${YELLOW}🗑️  Dropping database if exists...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || true

echo -e "${YELLOW}🆕 Creating database...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Run initialization script
echo -e "${YELLOW}🏗️  Running database initialization script...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f post-service/init.sql

echo -e "${GREEN}✅ Database reset completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Database Schema:${NC}"
echo "  ✅ user_cache table (for user information caching)"
echo "  ✅ posts table (with proper constraints and indexes)"
echo "  ✅ post_likes table (with unique constraints)"
echo "  ✅ Performance indexes (author, created_at, content search)"
echo "  ✅ Full-text search indexes"
echo ""
echo -e "${GREEN}🚀 The post-service database is now ready!${NC}"
