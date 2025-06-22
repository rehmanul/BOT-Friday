#!/bin/bash

# Exit on any error
set -e

echo "Starting Render build process..."

# Install Chrome for Puppeteer
echo "Installing Chrome..."
apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libxss1 \
  libgconf-2-4

# Add Google Chrome repository
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list

# Install Google Chrome
apt-get update && apt-get install -y google-chrome-stable

# Install dependencies
echo "Installing dependencies..."
npm ci

# Install Puppeteer browsers
echo "Installing Puppeteer browsers..."
npx puppeteer browsers install chrome

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!"