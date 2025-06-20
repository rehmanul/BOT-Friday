
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "../shared/sqlite-schema";

// Force SQLite for development
console.log("Using SQLite for development");
const sqlite = new Database('./dev.db');
export const db = drizzle(sqlite, { schema });
