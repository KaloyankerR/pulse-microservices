#!/bin/bash

# Development script for Pulse User Service

echo "Starting Pulse User Service in development mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "Generating Prisma client..."
npm run db:generate

# Check database connection and run migrations
echo "Setting up database..."
npm run db:push

# Seed the database with sample data
echo "Seeding database..."
npm run db:seed

# Start the development server
echo "Starting development server with hot reload..."
npm run dev
