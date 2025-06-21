import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema";

// Use PostgreSQL for both development and production
const databaseUrl = process.env.DATABASE_URL || 'postgresql://yang:nNTm6Q4un1aF25fmVvl7YqSzWffyznIe@dpg-d0t3rlili9vc739k84gg-a.oregon-postgres.render.com/dg4u_tiktok_bot';

console.log(`Connecting to PostgreSQL database...`);

const client = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });