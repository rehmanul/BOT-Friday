#!/usr/bin/env node

import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://yang:nNTm6Q4un1aF25fmVvl7YqSzWffyznIe@dpg-d0t3rlili9vc739k84gg-a.oregon-postgres.render.com/dg4u_tiktok_bot';

console.log('Setting up PostgreSQL database...');

const sql = postgres(databaseUrl);

try {
  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      profile_picture VARCHAR(500),
      tiktok_session JSONB,
      settings JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      target_invitations INTEGER NOT NULL,
      daily_limit INTEGER NOT NULL DEFAULT 20,
      invitation_template TEXT NOT NULL,
      human_like_delays BOOLEAN DEFAULT true,
      ai_optimization BOOLEAN DEFAULT true,
      filters JSONB,
      sent_count INTEGER DEFAULT 0,
      response_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log('Database tables created successfully!');

  // Create a default admin user if none exists
  const existingUsers = await sql`SELECT id FROM users LIMIT 1`;

  if (existingUsers.length === 0) {
    await sql`
      INSERT INTO users (username, email, password_hash, full_name, settings)
      VALUES (
        'admin',
        'admin@yourdomain.com',
        'change_me_after_deployment',
        'System Administrator',
        '{"theme": "dark", "notifications": true, "autoSave": true}'
      )
    `;
    console.log('Created default admin user');
  }

} catch (error) {
  console.error('Database setup failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}