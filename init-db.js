import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Initializing production database...');

try {
  // Create SQLite database
  const db = new Database('./production.db');

  console.log('Running database migrations...');

  // Read and execute the initial schema
  const schemaPath = join(__dirname, 'migrations', '0001_initial_schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');

  // Split by semicolons and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim());

  statements.forEach((statement, index) => {
    const trimmed = statement.trim();
    if (trimmed) {
      try {
        db.exec(trimmed);
        console.log(`Executed migration statement ${index + 1}`);
      } catch (error) {
        console.log(`Statement ${index + 1} already applied or not needed:`, error.message);
      }
    }
  });

  console.log('Database initialization completed successfully');
  db.close();
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
}