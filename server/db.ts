

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "./utils/logger";
import * as schema from "../shared/schema";

let db: ReturnType<typeof drizzle>;
let sql: ReturnType<typeof postgres>;

export async function initializeDatabase() {
  try {
    if (process.env.NODE_ENV === "production") {
      // Production PostgreSQL connection
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is required in production");
      }
      
      logger.info("Connecting to PostgreSQL database...", "database");
      sql = postgres(databaseUrl, {
        ssl: { rejectUnauthorized: false },
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      
      db = drizzle(sql, { schema });
      
      // Test connection
      await sql`SELECT 1`;
      logger.info("PostgreSQL connection established successfully", "database");
      
      // Create tables if they don't exist
      await createTablesIfNotExists();
      
    } else {
      // Development SQLite connection
      const Database = (await import("better-sqlite3")).default;
      const sqlite = new Database("dev.db");
      const { drizzle: drizzleSqlite } = await import("drizzle-orm/better-sqlite3");
      
      db = drizzleSqlite(sqlite, { schema: await import("../shared/sqlite-schema") });
      logger.info("SQLite connection established for development", "database");
    }
    
    return db;
  } catch (error) {
    logger.error("Failed to initialize database", "database", undefined, error);
    throw error;
  }
}

async function createTablesIfNotExists() {
  try {
    // Create tables using raw SQL for PostgreSQL
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS creators (
        id SERIAL PRIMARY KEY,
        tiktok_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        follower_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        likes_count BIGINT DEFAULT 0,
        video_count INTEGER DEFAULT 0,
        category VARCHAR(255),
        bio TEXT,
        avatar_url TEXT,
        verification_status VARCHAR(50) DEFAULT 'unverified',
        engagement_rate DECIMAL(5,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        target_criteria JSONB,
        invitation_template TEXT,
        daily_limit INTEGER DEFAULT 20,
        hourly_limit INTEGER DEFAULT 5,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS campaign_invitations (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
        creator_id INTEGER NOT NULL REFERENCES creators(id),
        status VARCHAR(50) DEFAULT 'pending',
        invitation_message TEXT,
        sent_at TIMESTAMP,
        response_received_at TIMESTAMP,
        response_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS browser_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_data JSONB,
        cookies TEXT,
        user_agent VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        target_type VARCHAR(100),
        target_id INTEGER,
        details JSONB,
        ip_address INET,
        user_agent VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_creators_tiktok_id ON creators(tiktok_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_invitations_campaign_id ON campaign_invitations(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_browser_sessions_user_id ON browser_sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)`;

    logger.info("Database tables created/verified successfully", "database");
  } catch (error) {
    logger.error("Failed to create database tables", "database", undefined, error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
}

export async function closeDatabase() {
  if (sql) {
    await sql.end();
    logger.info("Database connection closed", "database");
  }
}

// Export db for backwards compatibility, but ensure it's initialized first
export { db };
