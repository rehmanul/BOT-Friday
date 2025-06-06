import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 100 }),
  profilePicture: varchar("profile_picture", { length: 500 }),
  tiktokSession: jsonb("tiktok_session"),
  settings: jsonb("settings"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, active, paused, completed, stopped
  targetInvitations: integer("target_invitations").notNull(),
  dailyLimit: integer("daily_limit").notNull().default(20),
  invitationTemplate: text("invitation_template").notNull(),
  humanLikeDelays: boolean("human_like_delays").default(true),
  aiOptimization: boolean("ai_optimization").default(true),
  filters: jsonb("filters"), // JSON object with filtering criteria
  sentCount: integer("sent_count").default(0),
  responseCount: integer("response_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Creators table
export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  followers: integer("followers"),
  category: text("category"),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  gmv: decimal("gmv", { precision: 12, scale: 2 }),
  profileData: jsonb("profile_data"), // Additional profile information
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign Invitations table
export const campaignInvitations = pgTable("campaign_invitations", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, sent, responded, failed, skipped
  invitationText: text("invitation_text"),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  responseText: text("response_text"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Browser Sessions table
export const browserSessions = pgTable("browser_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionData: jsonb("session_data"), // Puppeteer session storage
  isActive: boolean("is_active").default(false),
  lastActivity: timestamp("last_activity").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  type: varchar("type", { length: 50 }).notNull(), // invitation_sent, response_received, session_refresh, etc.
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // Additional contextual data
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  browserSessions: many(browserSessions),
  activityLogs: many(activityLogs),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  invitations: many(campaignInvitations),
  activityLogs: many(activityLogs),
}));

export const creatorsRelations = relations(creators, ({ many }) => ({
  invitations: many(campaignInvitations),
}));

export const campaignInvitationsRelations = relations(campaignInvitations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignInvitations.campaignId],
    references: [campaigns.id],
  }),
  creator: one(creators, {
    fields: [campaignInvitations.creatorId],
    references: [creators.id],
  }),
}));

export const browserSessionsRelations = relations(browserSessions, ({ one }) => ({
  user: one(users, {
    fields: [browserSessions.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [activityLogs.campaignId],
    references: [campaigns.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentCount: true,
  responseCount: true,
  conversionCount: true,
});

export const insertCreatorSchema = createInsertSchema(creators).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertCampaignInvitationSchema = createInsertSchema(campaignInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertBrowserSessionSchema = createInsertSchema(browserSessions).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;

export type CampaignInvitation = typeof campaignInvitations.$inferSelect;
export type InsertCampaignInvitation = z.infer<typeof insertCampaignInvitationSchema>;

export type BrowserSession = typeof browserSessions.$inferSelect;
export type InsertBrowserSession = z.infer<typeof insertBrowserSessionSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;