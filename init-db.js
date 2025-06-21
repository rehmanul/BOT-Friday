#!/usr/bin/env node

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import path from 'path';

console.log('Initializing production database...');

try {
  const dbPath = './prod.db';
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  // Check if migrations directory exists
  const migrationsPath = path.join(process.cwd(), 'migrations');
  if (fs.existsSync(migrationsPath)) {
    console.log('Running database migrations...');
    migrate(db, { migrationsFolder: migrationsPath });
    console.log('Database migrations completed successfully');
  } else {
    console.log('No migrations directory found');
    // Create basic tables using SQL if no migrations exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS creators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        followers INTEGER DEFAULT 0,
        engagement_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Basic database schema created');
  }

  sqlite.close();
  console.log('Database initialization completed');
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
}