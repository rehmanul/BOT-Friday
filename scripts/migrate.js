#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';
const dbPath = isDevelopment ? './dev.db' : './production.db';

console.log(`Running migrations for ${isDevelopment ? 'development' : 'production'} database...`);

try {
  const db = new Database(dbPath);

  // Read and execute the initial schema
  const schemaPath = join(__dirname, '..', 'migrations', '0001_initial_schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');

  // Split by semicolons and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim());

  statements.forEach((statement, index) => {
    const trimmed = statement.trim();
    if (trimmed) {
      try {
        db.exec(trimmed);
        console.log(`✓ Executed migration statement ${index + 1}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`✓ Statement ${index + 1} already applied`);
        } else {
          console.error(`✗ Error in statement ${index + 1}:`, error.message);
          throw error;
        }
      }
    }
  });

  console.log('✓ All migrations completed successfully');
  db.close();
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}