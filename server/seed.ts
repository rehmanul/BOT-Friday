import { db } from "./db";
import { users, creators, campaigns } from "../shared/sqlite-schema";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      // Create a default admin user - change these credentials after first login
      const user = await db.insert(users).values({
        username: "admin",
        email: process.env.ADMIN_EMAIL || "admin@yourdomain.com",
        passwordHash: process.env.ADMIN_PASSWORD_HASH || "change_me_after_deployment",
        fullName: "System Administrator",
        settings: JSON.stringify({
          theme: 'dark',
          notifications: true,
          autoSave: true
        }),
      }).returning();

      console.log("Created default user:", user[0]);

      console.log("Database seeded with admin user only - ready for production");
    } else {
      console.log("Users already exist, skipping seed");
    }

    console.log("Database seed completed successfully");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seed();