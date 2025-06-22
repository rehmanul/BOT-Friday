
#!/usr/bin/env node

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://yang:nNTm6Q4un1aF25fmVvl7YqSzWffyznIe@dpg-d0t3rlili9vc739k84gg-a.oregon-postgres.render.com/dg4u_tiktok_bot';

console.log('Running database migrations...');

const sql = postgres(databaseUrl);

try {
  // Create migrations table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Get list of executed migrations
  const executedMigrations = await sql`
    SELECT filename FROM migrations ORDER BY id
  `;
  
  const executedFiles = new Set(executedMigrations.map(m => m.filename));

  // Read migration files
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    if (!executedFiles.has(file)) {
      console.log(`Executing migration: ${file}`);
      
      const migrationSQL = fs.readFileSync(
        path.join(migrationsDir, file), 
        'utf8'
      );
      
      // Execute migration
      await sql.unsafe(migrationSQL);
      
      // Record migration as executed
      await sql`
        INSERT INTO migrations (filename) VALUES (${file})
      `;
      
      console.log(`✓ Migration ${file} executed successfully`);
    } else {
      console.log(`⏭ Migration ${file} already executed`);
    }
  }

  console.log('All migrations completed successfully!');

} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
