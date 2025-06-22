#!/bin/bash

# Render Build Script - Ensures all dependencies are available
set -e

echo "Starting Render build process..."

# Install all dependencies including dev dependencies
echo "Installing dependencies..."
npm install --include=dev

# Install Chrome for Puppeteer with proper cache directory
echo "Installing Chrome for Puppeteer..."
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR
npx puppeteer browsers install chrome --path $PUPPETEER_CACHE_DIR

echo "Setting up PostgreSQL database..."
node scripts/setup-postgres.js

echo "Running database migrations..."
node scripts/migrate.js

# Verify vite is available
if ! command -v vite &> /dev/null; then
    echo "Vite not found in PATH, using npx..."
    npx vite build
else
    echo "Building frontend with Vite..."
    vite build
fi

# Build backend
echo "Building backend with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"