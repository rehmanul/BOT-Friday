import { db } from "./db";
import { users, creators, campaigns } from "../shared/sqlite-schema";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      // Create a default user
      const user = await db.insert(users).values({
        username: "admin",
        email: "admin@example.com",
        passwordHash: "default_hash",
        fullName: "Administrator",
        settings: JSON.stringify({}),
      }).returning();

      console.log("Created default user:", user[0]);

      // Create some sample creators
      const sampleCreators = [
        {
          username: 'creator1',
          displayName: 'Creative Sarah',
          email: 'sarah@example.com',
          followerCount: 125000,
          engagementRate: 4.2,
          niche: 'lifestyle',
          isVerified: true,
          bio: 'Lifestyle content creator passionate about wellness and travel',
          profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bf?w=150&h=150&fit=crop&crop=face'
        },
        {
          username: 'creator2', 
          displayName: 'Tech Mike',
          email: 'mike@example.com',
          followerCount: 89000,
          engagementRate: 5.8,
          niche: 'technology',
          isVerified: false,
          bio: 'Tech reviews and gadget enthusiast',
          profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        {
          username: 'creator3',
          displayName: 'Fitness Emma',
          email: 'emma@example.com',
          followerCount: 215000,
          engagementRate: 6.1,
          niche: 'fitness',
          isVerified: true,
          bio: 'Certified personal trainer sharing workout tips and motivation',
          profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        },
        {
          username: 'creator4',
          displayName: 'Chef Antonio',
          email: 'antonio@example.com',
          followerCount: 178000,
          engagementRate: 7.3,
          niche: 'food',
          isVerified: true,
          bio: 'Professional chef showcasing delicious recipes and cooking techniques',
          profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        {
          username: 'creator5',
          displayName: 'Art Luna',
          email: 'luna@example.com',
          followerCount: 95000,
          engagementRate: 5.4,
          niche: 'art',
          isVerified: false,
          bio: 'Digital artist creating stunning visual content and tutorials',
          profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
        }
      ];

      for (const creatorData of sampleCreators) {
        await db.insert(creators).values(creatorData);
      }

      console.log("Created sample creators");

      // Create a sample campaign
      await db.insert(campaigns).values({
        userId: user[0].id,
        name: "Phone Repair Campaign",
        description: "Outreach campaign for phone repair services",
        status: "draft",
        targetInvitations: 50,
        invitationTemplate: "Hi! We'd love to collaborate with you on phone repair content.",
        sentCount: 0,
        responseCount: 0,
      });

      console.log("Created sample campaign");
    } else {
      console.log("Users already exist, skipping seed");
    }

    console.log("Database seed completed successfully");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seed();