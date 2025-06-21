#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting build process...');

try {
  // Install dependencies including dev dependencies
  console.log('Installing dependencies...');
  execSync('npm install --include=dev', { stdio: 'inherit' });

  // Build frontend
  console.log('Building frontend...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
  } catch (error) {
    console.log('Vite build failed, trying alternative approach...');
    execSync('node_modules/.bin/vite build', { stdio: 'inherit' });
  }

  // Build backend
  console.log('Building backend...');
  try {
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  } catch (error) {
    console.log('ESBuild failed, trying alternative approach...');
    execSync('node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}