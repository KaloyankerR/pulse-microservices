#!/bin/bash

# Pulse Microservices Database Setup Script
# This script creates the required databases and users for local development

echo "🚀 Setting up Pulse Microservices Databases..."

# Database configuration
DB_USER="pulse_user"
DB_PASSWORD="pulse_user"
USER_DB="pulse_users"
POST_DB="pulse_posts_service_db"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create user if it doesn't exist
echo "👤 Creating database user: $DB_USER"
psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User $DB_USER already exists"

# Create databases
echo "📊 Creating database: $USER_DB"
createdb -U postgres $USER_DB 2>/dev/null || echo "Database $USER_DB already exists"

echo "📊 Creating database: $POST_DB"
createdb -U postgres $POST_DB 2>/dev/null || echo "Database $POST_DB already exists"

# Grant privileges
echo "🔐 Granting privileges..."
psql -c "GRANT ALL PRIVILEGES ON DATABASE $USER_DB TO $DB_USER;" 2>/dev/null
psql -c "GRANT ALL PRIVILEGES ON DATABASE $POST_DB TO $DB_USER;" 2>/dev/null

echo "✅ Database setup complete!"
echo ""
echo "📋 Database Information:"
echo "   User Service DB: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$USER_DB"
echo "   Post Service DB: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$POST_DB"
echo ""
echo "🔧 Next steps:"
echo "   1. Copy user-service/env.example to user-service/.env"
echo "   2. Run 'cd user-service && npx prisma db push'"
echo "   3. Start your services"
