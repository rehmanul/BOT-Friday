
#!/bin/bash

echo "🚀 Starting production deployment..."

# Check if required environment variables are set
if [ -z "$TIKTOK_APP_ID" ] || [ -z "$TIKTOK_APP_SECRET" ] || [ -z "$API_KEY" ]; then
    echo "❌ Error: Required environment variables not set!"
    echo "Please set TIKTOK_APP_ID, TIKTOK_APP_SECRET, and API_KEY in Replit Secrets"
    exit 1
fi

# Set production environment
export NODE_ENV=production

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations if needed
echo "🗄️ Setting up database..."
npm run db:push

# Seed the database with initial data
echo "🌱 Seeding database..."
node dist/seed.js

# Start the production server
echo "✅ Starting production server..."
npm run start
