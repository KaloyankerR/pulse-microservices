#!/bin/bash
# Social Service Setup Script

set -e

echo "🚀 Setting up Social Service..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npm run db:generate

# Run database migrations
echo "🗄️  Running database migrations..."
echo "⚠️  Make sure PostgreSQL is running and DATABASE_URL is correct in .env"
read -p "Press enter to continue or Ctrl+C to cancel..."

npm run db:migrate

# Optional: Seed database
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the service:"
echo "  npm run dev    # Development mode"
echo "  npm start      # Production mode"
echo ""
echo "API Documentation: http://localhost:8085/api-docs"
echo "Health Check: http://localhost:8085/health"
echo ""

