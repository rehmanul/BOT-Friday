import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "../shared/sqlite-schema";

// Force SQLite for development
const dbPath = process.env.NODE_ENV === 'production' ? './prod.db' : './dev.db';
console.log(`Using SQLite database: ${dbPath}`);
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });