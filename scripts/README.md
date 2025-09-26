# Pulse Microservices Database Scripts

This folder contains database management scripts for the Pulse microservices project.

## Scripts Overview

### `reset-databases.sh`
Main database reset script that creates or resets all databases for the entire Pulse microservices ecosystem.

**Features:**
- Creates PostgreSQL databases for all services
- Creates MongoDB database for messaging service
- Sets up basic database schemas
- Creates necessary indexes
- Supports selective database creation

**Usage:**
```bash
# Reset all databases
./scripts/reset-databases.sh

# Create only PostgreSQL databases
./scripts/reset-databases.sh --postgres-only

# Create only MongoDB databases
./scripts/reset-databases.sh --mongo-only

# Show help
./scripts/reset-databases.sh --help
```

### `reset-user-service-db.sh`
User service specific database reset script that handles Prisma migrations and seeding.

**Features:**
- Resets user service database schema
- Runs Prisma migrations
- Generates Prisma client
- Optional database seeding
- Dependency installation

**Usage:**
```bash
# Reset user service database with optional seeding
./scripts/reset-user-service-db.sh

# Reset without seeding
./scripts/reset-user-service-db.sh --no-seed

# Only run seeding
./scripts/reset-user-service-db.sh --seed-only

# Show help
./scripts/reset-user-service-db.sh --help
```

## Prerequisites

### PostgreSQL
- PostgreSQL server running (default: localhost:5432)
- `pg_isready` command available
- `psql` command available

### MongoDB
- MongoDB server running (default: localhost:27017)
- `mongosh` command available

### Node.js
- Node.js 18+ installed
- npm available

## Environment Variables

### PostgreSQL Configuration
```bash
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_ADMIN_USER=kalo
export POSTGRES_USER=pulse_user
export POSTGRES_PASSWORD=pulse_user
```

### MongoDB Configuration
```bash
export MONGO_HOST=localhost
export MONGO_PORT=27017
```

## Database Schema

The scripts create the following databases according to the `DATABASE&SCHEMAS.md` specification:

### PostgreSQL Databases
- `pulse_users` - User authentication and profiles
- `pulse_social` - Follow relationships and social graph
- `pulse_posts` - Posts, comments, and engagement
- `pulse_events` - Events and RSVPs
- `pulse_notifications` - User notifications

### MongoDB Databases
- `pulse_messaging` - Conversations and messages

## Service Integration

After running the database reset scripts:

1. **User Service**: Run `npm run db:push` in the user-service directory
2. **Other Services**: Run their respective database setup commands
3. **Start Services**: Use the main project scripts to start all services

## Troubleshooting

### Common Issues

1. **PostgreSQL Connection Failed**
   - Ensure PostgreSQL is running
   - Check connection parameters
   - Verify user permissions

2. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check if mongosh is installed
   - Verify connection parameters

3. **Prisma Errors**
   - Ensure Node.js dependencies are installed
   - Check DATABASE_URL in .env file
   - Run `npx prisma generate` manually

4. **Permission Denied**
   - Make scripts executable: `chmod +x scripts/*.sh`
   - Check database user permissions

### Logs
- Check service logs in `logs/` directory
- PostgreSQL logs: Check system logs or PostgreSQL log directory
- MongoDB logs: Check MongoDB log directory

## Development Workflow

1. **Initial Setup**
   ```bash
   ./scripts/reset-databases.sh
   ./scripts/reset-user-service-db.sh
   ```

2. **Service Development**
   ```bash
   # Reset specific service database
   ./scripts/reset-user-service-db.sh --no-seed
   
   # Start services
   ./start-local-services.sh
   ```

3. **Testing**
   ```bash
   # Reset all databases for clean test environment
   ./scripts/reset-databases.sh
   ```

## Contributing

When adding new services or modifying database schemas:

1. Update the appropriate reset script
2. Add new database creation logic
3. Update this README
4. Test the scripts thoroughly
