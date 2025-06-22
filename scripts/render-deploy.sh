
#!/bin/bash

# Render deployment script
echo "Starting Render deployment..."

# Install Chrome/Chromium for Puppeteer
echo "Installing Chrome dependencies..."
apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libatspi2.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  --no-install-recommends

# Try to install Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable --no-install-recommends \
  || echo "Chrome installation failed, will use bundled Chromium"

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --include=dev

# Build the application
echo "Building application..."
npm run build

# Initialize database
echo "Initializing database..."
node init-db.js

echo "Deployment completed successfully!"
