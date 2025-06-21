import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "../shared/sqlite-schema";
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import path from 'path';

// Force SQLite for development
const dbPath = process.env.NODE_ENV === 'production' ? './prod.db' : './dev.db';
console.log(`Using SQLite database: ${dbPath}`);
const sqlite = new Database(dbPath);

// Initialize database with schema
try {
  // Check if migrations directory exists
  const migrationsPath = path.join(process.cwd(), 'migrations');
  if (fs.existsSync(migrationsPath)) {
    console.log('Running database migrations...');
    migrate(drizzle(sqlite), { migrationsFolder: migrationsPath });
  } else {
    console.log('No migrations directory found, skipping migration');
  }
} catch (error: any) {
  console.log('Migration failed or not needed:', error?.message || String(error));
}

export const db = drizzle(sqlite, { schema });