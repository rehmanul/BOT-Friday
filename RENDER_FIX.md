# Render Deployment Fix - Manual Configuration

## Problem
Render is using cached build command: `npm install; npm run build`
This fails because vite is in devDependencies and not available during build.

## Solution
Update the build command in your Render service dashboard to:

```
npm install --include=dev && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## Steps to Fix in Render Dashboard:

1. Go to https://dashboard.render.com
2. Find your "tiktok-automation" service
3. Click on the service name
4. Go to "Settings" tab
5. Scroll to "Build & Deploy" section
6. Change "Build Command" from:
   `npm install; npm run build`
   to:
   `npm install --include=dev && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
7. Click "Save Changes"
8. Go to "Deploys" tab and click "Deploy latest commit"

## What this fixes:
- Installs devDependencies with `--include=dev`
- Uses `npx` to ensure vite and esbuild are available
- Bypasses npm script caching issues
- Builds both frontend and backend directly

Your deployment will succeed after this change.