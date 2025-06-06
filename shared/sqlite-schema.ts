import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username", { length: 50 }).notNull().unique(),
  email: text("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash", { length: 255 }).notNull(),
  fullName: text("full_name", { length: 100 }),
  profilePicture: text("profile_picture", { length: 500 }),
  tiktokSession: text("tiktok_session"), // JSON as text in SQLite
  settings: text("settings"), // JSON as text in SQLite
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Campaigns table
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { length: 20 }).notNull().default("draft"), // draft, active, paused, completed, stopped
  targetInvitations: integer("target_invitations").notNull(),
  dailyLimit: integer("daily_limit").notNull().default(20),
  invitationTemplate: text("invitation_template").notNull(),
  humanLikeDelays: integer("human_like_delays", { mode: "boolean" }).default(true),
  aiOptimization: integer("ai_optimization", { mode: "boolean" }).default(true),
  filters: text("filters"), // JSON as text in SQLite
  sentCount: integer("sent_count").default(0),
  responseCount: integer("response_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Creators table
export const creators = sqliteTable("creators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  followers: integer("followers"),
  category: text("category"),
  engagementRate: real("engagement_rate"),
  gmv: real("gmv"),
  profilePicture: text("profile_picture"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  bio: text("bio"),
  profileData: text("profile_data"), // JSON as text in SQLite
  lastUpdated: integer("last_updated", { mode: 'timestamp' }).default(sql`(datetime('now', 'localtime'))`).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Campaign Invitations table
export const campaignInvitations = sqliteTable("campaign_invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  status: text("status", { length: 20 }).notNull().default("pending"), // pending, sent, responded, failed, skipped
  invitationText: text("invitation_text"),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  responseText: text("response_text"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Browser Sessions table
export const browserSessions = sqliteTable("browser_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionData: text("session_data"), // JSON as text in SQLite
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  lastActivity: integer("last_activity", { mode: "timestamp" }).default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Activity Logs table
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  type: text("type", { length: 50 }).notNull(), // invitation_sent, response_received, session_refresh, etc.
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON as text in SQLite
  timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`(unixepoch())`),
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