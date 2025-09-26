# Database Configuration Guide

This document contains the database configuration for all Pulse microservices.

## Database URLs

### User Service Database
- **Database Name**: `pulse_users`
- **Username**: `pulse_user`
- **Password**: `pulse_user`
- **Host**: `localhost`
- **Port**: `5432`
- **Connection String**: `postgresql://pulse_user:pulse_user@localhost:5432/pulse_users`

### Post Service Database
- **Database Name**: `pulse_posts_service_db`
- **Username**: `pulse_user`
- **Password**: `pulse_user`
- **Host**: `localhost`
- **Port**: `5432`
- **Connection String**: `postgresql://pulse_user:pulse_user@localhost:5432/pulse_posts_service_db`

## Configuration Files

### User Service
- **Environment File**: `user-service/.env` (copy from `user-service/env.example`)
- **Key**: `DATABASE_URL`

### Post Service
- **Configuration File**: `post-service/src/main/resources/application.yml`
- **Keys**: `spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password`

## Setup Instructions

1. **Create Local Databases**:
   ```sql
   -- Connect to PostgreSQL as superuser
   CREATE DATABASE pulse_users;
   CREATE DATABASE pulse_posts_service_db;
   CREATE USER pulse_user WITH PASSWORD 'pulse_user';
   GRANT ALL PRIVILEGES ON DATABASE pulse_users TO pulse_user;
   GRANT ALL PRIVILEGES ON DATABASE pulse_posts_service_db TO pulse_user;
   ```

2. **User Service Setup**:
   ```bash
   cd user-service
   cp env.example .env
   # Edit .env if needed (default values should work)
   npm install
   npx prisma generate
   npx prisma db push
   ```

3. **Post Service Setup**:
   ```bash
   cd post-service
   # Configuration is already set in application.yml
   mvn clean install
   ```

## Docker vs Local Development

- **Local Development**: Services connect to local PostgreSQL instances
- **Docker Development**: Services connect to Docker containers (different configuration)

## Troubleshooting

- Ensure PostgreSQL is running on localhost:5432
- Verify databases exist and user has proper permissions
- Check that no other services are using port 5432
- For Docker development, use the docker-compose configurations

## Updating Configuration

To change database settings:

1. Update this file with new connection details
2. Update `user-service/env.example` for user service
3. Update `post-service/src/main/resources/application.yml` for post service
4. Update any Docker configurations if using containerized databases
