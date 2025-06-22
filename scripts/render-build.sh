#!/bin/bash
set -e

echo "Installing dependencies..."
npm install --include=dev

echo "Installing Chrome..."
apt-get update
apt-get install -y wget gnupg
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
apt-get update
apt-get install -y google-chrome-stable

echo "Building frontend..."
npx vite build

echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Running database migrations..."
node scripts/migrate-postgres.js

echo "Build complete!"