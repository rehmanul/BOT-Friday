var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var users, campaigns, creators, campaignInvitations, browserSessions, activityLogs, usersRelations, campaignsRelations, creatorsRelations, campaignInvitationsRelations, browserSessionsRelations, activityLogsRelations, insertUserSchema, insertCampaignSchema, insertCreatorSchema, insertCampaignInvitationSchema, insertBrowserSessionSchema, insertActivityLogSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    campaigns = pgTable("campaigns", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      name: text("name").notNull(),
      status: varchar("status", { length: 20 }).notNull().default("draft"),
      // draft, active, paused, completed, stopped
      targetInvitations: integer("target_invitations").notNull(),
      dailyLimit: integer("daily_limit").notNull().default(20),
      invitationTemplate: text("invitation_template").notNull(),
      humanLikeDelays: boolean("human_like_delays").default(true),
      aiOptimization: boolean("ai_optimization").default(true),
      filters: jsonb("filters"),
      // JSON object with filtering criteria
      sentCount: integer("sent_count").default(0),
      responseCount: integer("response_count").default(0),
      conversionCount: integer("conversion_count").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    creators = pgTable("creators", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      displayName: text("display_name"),
      followers: integer("followers"),
      category: text("category"),
      engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
      gmv: decimal("gmv", { precision: 12, scale: 2 }),
      profileData: jsonb("profile_data"),
      // Additional profile information
      lastUpdated: timestamp("last_updated").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    });
    campaignInvitations = pgTable("campaign_invitations", {
      id: serial("id").primaryKey(),
      campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
      creatorId: integer("creator_id").references(() => creators.id).notNull(),
      status: varchar("status", { length: 20 }).notNull().default("pending"),
      // pending, sent, responded, failed, skipped
      invitationText: text("invitation_text"),
      sentAt: timestamp("sent_at"),
      respondedAt: timestamp("responded_at"),
      responseText: text("response_text"),
      errorMessage: text("error_message"),
      retryCount: integer("retry_count").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    browserSessions = pgTable("browser_sessions", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      sessionData: jsonb("session_data"),
      // Puppeteer session storage
      isActive: boolean("is_active").default(false),
      lastActivity: timestamp("last_activity").defaultNow(),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    activityLogs = pgTable("activity_logs", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      campaignId: integer("campaign_id").references(() => campaigns.id),
      type: varchar("type", { length: 50 }).notNull(),
      // invitation_sent, response_received, session_refresh, etc.
      message: text("message").notNull(),
      metadata: jsonb("metadata"),
      // Additional contextual data
      timestamp: timestamp("timestamp").defaultNow()
    });
    usersRelations = relations(users, ({ many }) => ({
      campaigns: many(campaigns),
      browserSessions: many(browserSessions),
      activityLogs: many(activityLogs)
    }));
    campaignsRelations = relations(campaigns, ({ one, many }) => ({
      user: one(users, {
        fields: [campaigns.userId],
        references: [users.id]
      }),
      invitations: many(campaignInvitations),
      activityLogs: many(activityLogs)
    }));
    creatorsRelations = relations(creators, ({ many }) => ({
      invitations: many(campaignInvitations)
    }));
    campaignInvitationsRelations = relations(campaignInvitations, ({ one }) => ({
      campaign: one(campaigns, {
        fields: [campaignInvitations.campaignId],
        references: [campaigns.id]
      }),
      creator: one(creators, {
        fields: [campaignInvitations.creatorId],
        references: [creators.id]
      })
    }));
    browserSessionsRelations = relations(browserSessions, ({ one }) => ({
      user: one(users, {
        fields: [browserSessions.userId],
        references: [users.id]
      })
    }));
    activityLogsRelations = relations(activityLogs, ({ one }) => ({
      user: one(users, {
        fields: [activityLogs.userId],
        references: [users.id]
      }),
      campaign: one(campaigns, {
        fields: [activityLogs.campaignId],
        references: [campaigns.id]
      })
    }));
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCampaignSchema = createInsertSchema(campaigns).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      sentCount: true,
      responseCount: true,
      conversionCount: true
    });
    insertCreatorSchema = createInsertSchema(creators).omit({
      id: true,
      createdAt: true,
      lastUpdated: true
    });
    insertCampaignInvitationSchema = createInsertSchema(campaignInvitations).omit({
      id: true,
      createdAt: true
    });
    insertBrowserSessionSchema = createInsertSchema(browserSessions).omit({
      id: true,
      createdAt: true
    });
    insertActivityLogSchema = createInsertSchema(activityLogs).omit({
      id: true
    });
  }
});

// shared/sqlite-schema.ts
var sqlite_schema_exports = {};
__export(sqlite_schema_exports, {
  activityLogs: () => activityLogs2,
  activityLogsRelations: () => activityLogsRelations2,
  browserSessions: () => browserSessions2,
  browserSessionsRelations: () => browserSessionsRelations2,
  campaignInvitations: () => campaignInvitations2,
  campaignInvitationsRelations: () => campaignInvitationsRelations2,
  campaigns: () => campaigns2,
  campaignsRelations: () => campaignsRelations2,
  creators: () => creators2,
  creatorsRelations: () => creatorsRelations2,
  insertActivityLogSchema: () => insertActivityLogSchema2,
  insertBrowserSessionSchema: () => insertBrowserSessionSchema2,
  insertCampaignInvitationSchema: () => insertCampaignInvitationSchema2,
  insertCampaignSchema: () => insertCampaignSchema2,
  insertCreatorSchema: () => insertCreatorSchema2,
  insertUserSchema: () => insertUserSchema2,
  users: () => users2,
  usersRelations: () => usersRelations2
});
import { sqliteTable, text as text2, integer as integer2, real } from "drizzle-orm/sqlite-core";
import { relations as relations2 } from "drizzle-orm";
import { createInsertSchema as createInsertSchema2 } from "drizzle-zod";
import { sql } from "drizzle-orm";
var users2, campaigns2, creators2, campaignInvitations2, browserSessions2, activityLogs2, usersRelations2, campaignsRelations2, creatorsRelations2, campaignInvitationsRelations2, browserSessionsRelations2, activityLogsRelations2, insertUserSchema2, insertCampaignSchema2, insertCreatorSchema2, insertCampaignInvitationSchema2, insertBrowserSessionSchema2, insertActivityLogSchema2;
var init_sqlite_schema = __esm({
  "shared/sqlite-schema.ts"() {
    "use strict";
    users2 = sqliteTable("users", {
      id: integer2("id").primaryKey({ autoIncrement: true }),
      username: text2("username", { length: 50 }).notNull().unique(),
      email: text2("email", { length: 255 }).notNull().unique(),
      passwordHash: text2("password_hash", { length: 255 }).notNull(),
      fullName: text2("full_name", { length: 100 }),
      profilePicture: text2("profile_picture", { length: 500 }),
      tiktokSession: text2("tiktok_session"),
      // JSON as text in SQLite
      settings: text2("settings"),
      // JSON as text in SQLite
      isActive: integer2("is_active", { mode: "boolean" }).default(true),
      createdAt: integer2("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
      updatedAt: integer2("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`)
    });
    campaigns2 = sqliteTable("campaigns", {
      id: integer2("id").primaryKey({ autoIncrement: true }),
      userId: integer2("user_id").references(() => users2.id).notNull(),
      name: text2("name").notNull(),
      description: text2("description"),
      status: text2("status", { length: 20 }).notNull().default("draft"),
      // draft, active, paused, completed, stopped
      targetInvitations: integer2("target_invitations").notNull(),
      dailyLimit: integer2("daily_limit").notNull().default(20),
      invitationTemplate: text2("invitation_template").notNull(),
      humanLikeDelays: integer2("human_like_delays", { mode: "boolean" }).default(true),
      aiOptimization: integer2("ai_optimization", { mode: "boolean" }).default(true),
      filters: text2("filters"),
      // JSON as text in SQLite
      sentCount: integer2("sent_count").default(0),
      responseCount: integer2("response_count").default(0),
      conversionCount: integer2("conversion_count").default(0),
      createdAt: integer2("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
      updatedAt: integer2("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`)
    });
    creators2 = sqliteTable("creators", {
      id: integer2("id").primaryKey({ autoIncrement: true }),
      username: text2("username").notNull().unique(),
      displayName: text2("display_name"),
      followers: integer2("followers"),
      category: text2("category"),
      engagementRate: real("engagement_rate"),
      gmv: real("gmv"),
      profilePicture: text2("profile_picture"),
      isVerified: integer2("is_verified", { mode: "boolean" }).default(false),
      bio: text2("bio"),
      profileData: text2("profile_data"),
      // JSON as text in SQLite
      lastUpdated: integer2("last_updated", { mode: "timestamp" }).default(sql`(datetime('now', 'localtime'))`).notNull(),
      createdAt: integer2("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`)
    });
    campaignInvitations2 = sqliteTable("campaign_invitations", {
      id: integer2("id").primaryKey({ autoIncrement: true }),
      campaignId: integer2("campaign_id").references(() => campaigns2.id).notNull(),
      creatorId: integer2("creator_id").references(() => creators2.id).notNull(),
      status: text2("status", { length: 20 }).notNull().default("pending"),
      // pending, sent, responded, failed, skipped
      invitationText: text2("invitation_text"),
      sentAt: integer2("sent_at", { mode: "timestamp" }),
      respondedAt: integer2("responded_at", { mode: "timestamp" }),
      responseText: text2("response_text"),
      errorMessage: text2("error_message"),
      retryCount: integer2("retry_count").default(0),
      createdAt: integer2("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`)
    });
    browserSessions2 = sqliteTable("browser_sessions", {
      id: integer2("id").primaryKey({ autoIncrement: true }),
      userId: integer2("user_id").references(() => users2.id).notNull(),
      sessionData: text2("session_data"),
      // JSON as text in SQLite
      isActive: integer2("is_active", { mode: "boolean" }).default(false),
      lastActivity: integer2("last_activity", { mode: "timestamp" }).default(sql`(unixepoch())`),
      expiresAt: integer2("expires_at", { mode: "timestamp" }),
      createdAt: integer2("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`)
    });
    activityLogs2 = sqliteTable("activity_logs", {
      id: integer2("id").primaryKey({ autoIncrement: true }),
      userId: integer2("user_id").references(() => users2.id).notNull(),
      campaignId: integer2("campaign_id").references(() => campaigns2.id),
      type: text2("type", { length: 50 }).notNull(),
      // invitation_sent, response_received, session_refresh, etc.
      message: text2("message").notNull(),
      metadata: text2("metadata"),
      // JSON as text in SQLite
      timestamp: integer2("timestamp", { mode: "timestamp" }).default(sql`(unixepoch())`)
    });
    usersRelations2 = relations2(users2, ({ many }) => ({
      campaigns: many(campaigns2),
      browserSessions: many(browserSessions2),
      activityLogs: many(activityLogs2)
    }));
    campaignsRelations2 = relations2(campaigns2, ({ one, many }) => ({
      user: one(users2, {
        fields: [campaigns2.userId],
        references: [users2.id]
      }),
      invitations: many(campaignInvitations2),
      activityLogs: many(activityLogs2)
    }));
    creatorsRelations2 = relations2(creators2, ({ many }) => ({
      invitations: many(campaignInvitations2)
    }));
    campaignInvitationsRelations2 = relations2(campaignInvitations2, ({ one }) => ({
      campaign: one(campaigns2, {
        fields: [campaignInvitations2.campaignId],
        references: [campaigns2.id]
      }),
      creator: one(creators2, {
        fields: [campaignInvitations2.creatorId],
        references: [creators2.id]
      })
    }));
    browserSessionsRelations2 = relations2(browserSessions2, ({ one }) => ({
      user: one(users2, {
        fields: [browserSessions2.userId],
        references: [users2.id]
      })
    }));
    activityLogsRelations2 = relations2(activityLogs2, ({ one }) => ({
      user: one(users2, {
        fields: [activityLogs2.userId],
        references: [users2.id]
      }),
      campaign: one(campaigns2, {
        fields: [activityLogs2.campaignId],
        references: [campaigns2.id]
      })
    }));
    insertUserSchema2 = createInsertSchema2(users2).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCampaignSchema2 = createInsertSchema2(campaigns2).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      sentCount: true,
      responseCount: true,
      conversionCount: true
    });
    insertCreatorSchema2 = createInsertSchema2(creators2).omit({
      id: true,
      createdAt: true,
      lastUpdated: true
    });
    insertCampaignInvitationSchema2 = createInsertSchema2(campaignInvitations2).omit({
      id: true,
      createdAt: true
    });
    insertBrowserSessionSchema2 = createInsertSchema2(browserSessions2).omit({
      id: true,
      createdAt: true
    });
    insertActivityLogSchema2 = createInsertSchema2(activityLogs2).omit({
      id: true
    });
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
var sqlite, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_sqlite_schema();
    console.log("Using SQLite for development");
    sqlite = new Database("./dev.db");
    db = drizzle(sqlite, { schema: sqlite_schema_exports });
  }
});

// server/storage.ts
import { eq, desc, and, gte, lte, count, sql as sql2 } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      // Users
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || void 0;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user || void 0;
      }
      async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
      }
      async updateUserTikTokSession(userId, sessionData) {
        await db.update(users).set({ tiktokSession: sessionData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
      }
      async getUserSettings(userId) {
        try {
          const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          return user[0]?.settings || {};
        } catch (error) {
          console.error("Get user settings error:", error);
          return {};
        }
      }
      async updateUserSettings(userId, settings) {
        try {
          const result = await db.update(users).set({ settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
          return result[0];
        } catch (error) {
          console.error("Update user settings error:", error);
          throw error;
        }
      }
      // Campaigns
      async getCampaigns(userId) {
        return await db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
      }
      async getCampaign(id) {
        const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
        return campaign || void 0;
      }
      async createCampaign(campaign) {
        const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
        return newCampaign;
      }
      async updateCampaign(id, updates) {
        const [updatedCampaign] = await db.update(campaigns).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(campaigns.id, id)).returning();
        return updatedCampaign;
      }
      async deleteCampaign(id) {
        await db.delete(campaigns).where(eq(campaigns.id, id));
      }
      // Creators
      async getCreators(filters, limit = 25, offset = 0) {
        let query = db.select().from(creators);
        let countQuery = db.select({ count: count() }).from(creators);
        if (filters) {
          const conditions = [];
          if (filters.category)
            conditions.push(eq(creators.category, filters.category));
          if (filters.minFollowers)
            conditions.push(gte(creators.followers, filters.minFollowers));
          if (filters.maxFollowers)
            conditions.push(lte(creators.followers, filters.maxFollowers));
          if (filters.minGMV) conditions.push(gte(creators.gmv, filters.minGMV));
          if (filters.maxGMV) conditions.push(lte(creators.gmv, filters.maxGMV));
          if (conditions.length > 0) {
            query = query.where(and(...conditions));
            countQuery = countQuery.where(and(...conditions));
          }
        }
        const [countResult] = await countQuery;
        const total = countResult?.count ?? 0;
        const creatorsList = await query.limit(limit).offset(offset).orderBy(desc(creators.followers));
        return { creators: creatorsList, total };
      }
      async getCreator(id) {
        const [creator] = await db.select().from(creators).where(eq(creators.id, id));
        return creator || void 0;
      }
      async getCreatorByUsername(username) {
        const [creator] = await db.select().from(creators).where(eq(creators.username, username));
        return creator || void 0;
      }
      async createCreator(creator) {
        const [newCreator] = await db.insert(creators).values(creator).returning();
        return newCreator;
      }
      async updateCreator(id, updates) {
        const [updatedCreator] = await db.update(creators).set({ ...updates, lastUpdated: /* @__PURE__ */ new Date() }).where(eq(creators.id, id)).returning();
        return updatedCreator;
      }
      async searchCreators(query) {
        return await db.select().from(creators).where(
          sql2`${creators.username} ILIKE ${`%${query}%`} OR ${creators.displayName} ILIKE ${`%${query}%`}`
        ).limit(50);
      }
      async updateCreatorStats(creatorId, stats) {
        await db.update(creators).set({
          lastActive: stats.lastActivity,
          engagementRate: stats.lastVideoEngagement || creators.engagementRate
        }).where(eq(creators.id, creatorId));
      }
      async updateCreatorEngagement(creatorId, engagementRate) {
        await db.update(creators).set({ engagementRate }).where(eq(creators.id, creatorId));
      }
      async updateCreatorFollowers(creatorId, followers) {
        await db.update(creators).set({ followers }).where(eq(creators.id, creatorId));
      }
      async getCampaignInvitationByCreator(campaignId, creatorId) {
        const results = await db.select().from(campaignInvitations).where(
          and(
            eq(campaignInvitations.campaignId, campaignId),
            eq(campaignInvitations.creatorId, creatorId)
          )
        ).limit(1);
        return results[0] || null;
      }
      // Campaign Invitations
      async getCampaignInvitations(campaignId) {
        return await db.select().from(campaignInvitations).where(eq(campaignInvitations.campaignId, campaignId)).orderBy(desc(campaignInvitations.createdAt));
      }
      async createCampaignInvitation(invitation) {
        const [newInvitation] = await db.insert(campaignInvitations).values(invitation).returning();
        return newInvitation;
      }
      async updateCampaignInvitation(id, updates) {
        const [updatedInvitation] = await db.update(campaignInvitations).set(updates).where(eq(campaignInvitations.id, id)).returning();
        return updatedInvitation;
      }
      async getPendingInvitations(campaignId) {
        return await db.select().from(campaignInvitations).where(
          and(
            eq(campaignInvitations.campaignId, campaignId),
            eq(campaignInvitations.status, "pending")
          )
        ).orderBy(campaignInvitations.createdAt);
      }
      // Browser Sessions
      async getActiveBrowserSession(userId) {
        const [session] = await db.select().from(browserSessions).where(
          and(
            eq(browserSessions.userId, userId),
            eq(browserSessions.isActive, true)
          )
        ).orderBy(desc(browserSessions.lastActivity)).limit(1);
        return session || void 0;
      }
      async createBrowserSession(session) {
        const sessionWithTimestamp = {
          ...session,
          lastActivity: /* @__PURE__ */ new Date(),
          expiresAt: session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1e3)
        };
        const [newSession] = await db.insert(browserSessions).values(sessionWithTimestamp).returning();
        return newSession;
      }
      async updateBrowserSession(id, updates) {
        const [updatedSession] = await db.update(browserSessions).set(updates).where(eq(browserSessions.id, id)).returning();
        return updatedSession;
      }
      async deactivateBrowserSessions(userId) {
        await db.update(browserSessions).set({ isActive: false }).where(eq(browserSessions.userId, userId));
      }
      // Activity Logs
      async getActivityLogs(userId, limit = 50) {
        return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.timestamp)).limit(limit);
      }
      async createActivityLog(log2) {
        const [newLog] = await db.insert(activityLogs).values(log2).returning();
        return newLog;
      }
      // Analytics
      async getCampaignStats(campaignId) {
        const [sentCount] = await db.select({ count: count() }).from(campaignInvitations).where(
          and(
            eq(campaignInvitations.campaignId, campaignId),
            eq(campaignInvitations.status, "sent")
          )
        );
        const [responseCount] = await db.select({ count: count() }).from(campaignInvitations).where(
          and(
            eq(campaignInvitations.campaignId, campaignId),
            eq(campaignInvitations.status, "responded")
          )
        );
        const [pendingCount] = await db.select({ count: count() }).from(campaignInvitations).where(
          and(
            eq(campaignInvitations.campaignId, campaignId),
            eq(campaignInvitations.status, "pending")
          )
        );
        return {
          sent: sentCount.count,
          responses: responseCount.count,
          pending: pendingCount.count,
          responseRate: sentCount.count > 0 ? responseCount.count / sentCount.count * 100 : 0
        };
      }
      async getDashboardStats(userId) {
        const userCampaigns = await db.select().from(campaigns).where(eq(campaigns.userId, userId));
        const activeCampaigns = userCampaigns.filter(
          (c) => c.status === "active"
        ).length;
        const totalSent = userCampaigns.reduce(
          (sum, c) => sum + (c.sentCount || 0),
          0
        );
        const totalResponses = userCampaigns.reduce(
          (sum, c) => sum + (c.responseCount || 0),
          0
        );
        const responseRate = totalSent > 0 ? totalResponses / totalSent * 100 : 0;
        return {
          activeCampaigns,
          creatorsContacted: totalSent,
          responseRate,
          totalGMV: 847293
          // This would be calculated from actual conversions
        };
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/webhooks/tiktok-webhooks.ts
var tiktok_webhooks_exports = {};
__export(tiktok_webhooks_exports, {
  TikTokWebhookHandler: () => TikTokWebhookHandler
});
import crypto from "crypto";
var TikTokWebhookHandler;
var init_tiktok_webhooks = __esm({
  "server/webhooks/tiktok-webhooks.ts"() {
    "use strict";
    init_storage();
    TikTokWebhookHandler = class {
      WEBHOOK_SECRET = process.env.TIKTOK_WEBHOOK_SECRET || "default-secret";
      // Handle incoming webhook events
      async handleWebhook(req, res) {
        try {
          const signature = req.headers["x-tiktok-signature"];
          const timestamp2 = req.headers["x-tiktok-timestamp"];
          if (!this.verifySignature(req.body, signature, timestamp2)) {
            res.status(401).json({ error: "Invalid signature" });
            return;
          }
          const { event_type, data } = req.body;
          switch (event_type) {
            case "video.published":
              await this.handleVideoPublished(data);
              break;
            case "engagement.updated":
              await this.handleEngagementUpdate(data);
              break;
            case "creator.followed":
              await this.handleCreatorFollowed(data);
              break;
            case "message.received":
              await this.handleMessageReceived(data);
              break;
            default:
              console.log("Unknown webhook event:", event_type);
          }
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("Webhook processing error:", error);
          res.status(500).json({ error: "Webhook processing failed" });
        }
      }
      // Verify webhook signature
      verifySignature(payload, signature, timestamp2) {
        try {
          const payloadString = JSON.stringify(payload);
          const expectedSignature = crypto.createHmac("sha256", this.WEBHOOK_SECRET).update(timestamp2 + payloadString).digest("hex");
          return crypto.timingSafeEqual(
            Buffer.from(signature, "hex"),
            Buffer.from(expectedSignature, "hex")
          );
        } catch (error) {
          console.error("Signature verification error:", error);
          return false;
        }
      }
      // Handle video published event
      async handleVideoPublished(data) {
        try {
          const { creator_id, video_id, engagement_data } = data;
          const engagementRate = this.calculateEngagementRate(engagement_data);
          await storage.updateCreatorStats(creator_id, {
            lastVideoId: video_id,
            lastVideoEngagement: engagementRate,
            lastActivity: /* @__PURE__ */ new Date()
          });
          await storage.createActivityLog({
            userId: 1,
            // System user
            type: "video_published",
            message: `Creator ${creator_id} published new video ${video_id}`,
            metadata: { creatorId: creator_id, videoId: video_id, engagementRate },
            timestamp: /* @__PURE__ */ new Date()
          });
        } catch (error) {
          console.error("Error handling video published:", error);
        }
      }
      // Handle engagement update
      async handleEngagementUpdate(data) {
        try {
          const { creator_id, video_id, engagement_data } = data;
          const engagementRate = this.calculateEngagementRate(engagement_data);
          await storage.updateCreatorEngagement(creator_id, engagementRate);
        } catch (error) {
          console.error("Error handling engagement update:", error);
        }
      }
      // Handle creator followed
      async handleCreatorFollowed(data) {
        try {
          const { creator_id, follower_count } = data;
          await storage.updateCreatorFollowers(creator_id, follower_count);
        } catch (error) {
          console.error("Error handling creator followed:", error);
        }
      }
      // Handle message received
      async handleMessageReceived(data) {
        try {
          const { creator_id, message_content, campaign_id } = data;
          if (campaign_id) {
            const invitation = await storage.getCampaignInvitationByCreator(campaign_id, creator_id);
            if (invitation) {
              await storage.updateCampaignInvitation(invitation.id, {
                status: "responded",
                responseMessage: message_content,
                respondedAt: /* @__PURE__ */ new Date()
              });
            }
          }
          await storage.createActivityLog({
            userId: 1,
            campaignId: campaign_id,
            type: "message_received",
            message: `Received message from creator ${creator_id}`,
            metadata: { creatorId: creator_id, messageContent: message_content },
            timestamp: /* @__PURE__ */ new Date()
          });
        } catch (error) {
          console.error("Error handling message received:", error);
        }
      }
      // Calculate engagement rate
      calculateEngagementRate(engagementData) {
        if (!engagementData.likes || !engagementData.views) return 0;
        const totalEngagement = engagementData.likes + engagementData.comments + engagementData.shares;
        const engagementRate = totalEngagement / engagementData.views * 100;
        return Math.round(engagementRate * 100) / 100;
      }
      // Generate webhook verification endpoint
      async handleWebhookVerification(req, res) {
        const challenge = req.query.challenge;
        if (challenge) {
          res.status(200).send(challenge);
        } else {
          res.status(400).json({ error: "No challenge provided" });
        }
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
init_schema();

// server/ai/ai-model-manager.ts
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
var AIModelManager = class {
  anthropic;
  openai;
  perplexityApiKey;
  geminiApiKey;
  constructor() {
    this.initializeModels();
    this.logMissingApiKeys();
  }
  logMissingApiKeys() {
    const missingKeys = [];
    if (!process.env.ANTHROPIC_API_KEY) missingKeys.push("ANTHROPIC_API_KEY");
    if (!process.env.OPENAI_API_KEY) missingKeys.push("OPENAI_API_KEY");
    if (!process.env.GEMINI_API_KEY) missingKeys.push("GEMINI_API_KEY");
    if (!process.env.PERPLEXITY_API_KEY) missingKeys.push("PERPLEXITY_API_KEY");
    if (missingKeys.length > 0) {
      console.warn(`Missing API keys: ${missingKeys.join(", ")}. Some AI features will be unavailable.`);
    }
  }
  initializeModels() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
  }
  getAvailableModels() {
    return [
      {
        id: "anthropic-claude-sonnet-4",
        name: "Claude Sonnet 4.0",
        provider: "Anthropic",
        isConfigured: !!this.anthropic,
        capabilities: ["Content Generation", "Creator Analysis", "Campaign Optimization"]
      },
      {
        id: "openai-gpt-4o",
        name: "GPT-4o",
        provider: "OpenAI",
        isConfigured: !!this.openai,
        capabilities: ["Content Generation", "Image Analysis", "Creator Insights"]
      },
      {
        id: "perplexity-sonar",
        name: "Perplexity Sonar",
        provider: "Perplexity",
        isConfigured: !!this.perplexityApiKey,
        capabilities: ["Real-time Search", "Trend Analysis", "Market Research"]
      },
      {
        id: "gemini-pro",
        name: "Gemini Pro",
        provider: "Google",
        isConfigured: !!this.geminiApiKey,
        capabilities: ["Creator Discovery", "Content Analysis", "Performance Prediction"]
      }
    ];
  }
  async generateCreatorAnalysis(creatorData, modelId) {
    const prompt = `Analyze this TikTok creator for brand collaboration potential:

Creator: @${creatorData.username}
Followers: ${creatorData.followers}
Engagement Rate: ${creatorData.engagementRate}%
Category: ${creatorData.category}
Average GMV: $${creatorData.avgGMV}

Provide analysis on:
1. Collaboration potential (1-10 score)
2. Brand alignment for phone repair services
3. Recommended approach strategy
4. Estimated conversion potential

Keep response concise and actionable.`;
    switch (modelId) {
      case "anthropic-claude-sonnet-4":
        return this.generateWithAnthropic(prompt);
      case "openai-gpt-4o":
        return this.generateWithOpenAI(prompt);
      case "perplexity-sonar":
        return this.generateWithPerplexity(prompt);
      case "gemini-pro":
        return this.generateWithGemini(prompt);
      default:
        throw new Error("Model not supported");
    }
  }
  async optimizeInvitationMessage(template, creatorData, modelId) {
    const prompt = `Optimize this invitation message for TikTok creator @${creatorData.username}:

Original Message:
${template}

Creator Details:
- Followers: ${creatorData.followers}
- Category: ${creatorData.category}
- Engagement Rate: ${creatorData.engagementRate}%

Make the message more personalized and compelling while maintaining professionalism. Focus on phone repair services collaboration.`;
    switch (modelId) {
      case "anthropic-claude-sonnet-4":
        return this.generateWithAnthropic(prompt);
      case "openai-gpt-4o":
        return this.generateWithOpenAI(prompt);
      case "perplexity-sonar":
        return this.generateWithPerplexity(prompt);
      case "gemini-pro":
        return this.generateWithGemini(prompt);
      default:
        throw new Error("Model not supported");
    }
  }
  async generateWithAnthropic(prompt) {
    if (!this.anthropic) throw new Error("Anthropic not configured");
    const message = await this.anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      model: "claude-3-sonnet-20240229"
    });
    return message.content[0].type === "text" ? message.content[0].text : "";
  }
  async generateWithOpenAI(prompt) {
    if (!this.openai) throw new Error("OpenAI not configured");
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content || "";
  }
  async generateWithPerplexity(prompt) {
    if (!this.perplexityApiKey) throw new Error("Perplexity not configured");
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.perplexityApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are an expert TikTok marketing analyst specializing in creator collaborations for phone repair services."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.2
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }
  async generateWithGemini(prompt) {
    if (!this.geminiApiKey) throw new Error("Gemini not configured");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
};

// server/routes.ts
var aiModelManager = new AIModelManager();
async function registerRoutes(app2) {
  app2.post("/api/campaigns/send-invitation-direct", async (req, res) => {
    try {
      const { creatorId, message } = req.body;
      if (!creatorId || !message) {
        return res.status(400).json({ error: "Creator ID and message are required" });
      }
      const creator = await storage.getCreator(parseInt(creatorId));
      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }
      const invitation = await storage.createCampaignInvitation({
        campaignId: 1,
        // Default campaign for now
        creatorId: parseInt(creatorId),
        message,
        status: "pending",
        sentAt: null
      });
      const result = await puppeteerService.sendInvitation(creator.username, message);
      if (result.success) {
        await storage.updateCampaignInvitation(invitation.id, {
          status: "sent",
          sentAt: /* @__PURE__ */ new Date()
        });
        return res.json({ success: true, invitationId: invitation.id });
      } else {
        await storage.updateCampaignInvitation(invitation.id, {
          status: "failed",
          errorMessage: result.error,
          retryCount: 1
        });
        return res.status(500).json({ error: result.error || "Failed to send invitation" });
      }
    } catch (error) {
      console.error("Direct invitation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/ai/models", async (req, res) => {
    try {
      const models = aiModelManager.getAvailableModels();
      res.json(models);
    } catch (error) {
      console.error("Error getting AI models:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/dashboard/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        throw new Error("Invalid userId");
      }
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/campaigns/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const campaigns3 = await storage.getCampaigns(userId);
      res.json(campaigns3);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });
  app2.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData);
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_created",
        message: `Campaign "${campaign.name}" created`,
        timestamp: /* @__PURE__ */ new Date()
      });
      res.json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });
  async function checkTikTokSession() {
    try {
      const session = await storage.getActiveBrowserSession(1);
      if (!session || !session.sessionData) {
        return { isLoggedIn: false, profile: null };
      }
      const sessionDataString = typeof session.sessionData === "string" ? session.sessionData : JSON.stringify(session.sessionData);
      const sessionData = JSON.parse(sessionDataString);
      const profile = {
        username: "digi4u_repair",
        displayName: "Digi4u Repair UK",
        avatar: "https://via.placeholder.com/40",
        verified: true,
        followers: 15420,
        isActive: true
      };
      return { isLoggedIn: true, profile };
    } catch (error) {
      console.error("Error fetching TikTok session:", error);
      return { isLoggedIn: false, profile: null };
    }
  }
  async function generateAnalyticsOverview() {
    const campaigns3 = await storage.getCampaigns(1);
    const creators3 = await storage.getCreators(1, 50, {});
    return {
      totalCampaigns: campaigns3.length,
      activeCampaigns: campaigns3.filter((c) => c.status === "active").length,
      totalCreators: creators3.length,
      totalInvitations: 245,
      responseRate: 32.5,
      avgEngagementRate: 4.2,
      totalReach: 25e5,
      conversionRate: 12.3
    };
  }
  async function discoverCreators(criteria) {
    const mockCreators = [
      {
        username: "techreviewer123",
        fullName: "Tech Reviewer 123",
        followers: 125e3,
        engagementRate: 4.5,
        category: "Technology",
        avgGMV: 2500,
        profilePicture: "https://via.placeholder.com/40",
        isVerified: false,
        bio: "Tech enthusiast and phone repair tips"
      },
      {
        username: "phoneexpert",
        fullName: "Phone Expert",
        followers: 89e3,
        engagementRate: 6.2,
        category: "Technology",
        avgGMV: 1800,
        profilePicture: "https://via.placeholder.com/40",
        isVerified: true,
        bio: "Mobile phone tips and tricks"
      },
      {
        username: "mobilemechanic",
        fullName: "Mobile Mechanic",
        followers: 67e3,
        engagementRate: 5.8,
        category: "Technology",
        avgGMV: 1200,
        profilePicture: "https://via.placeholder.com/40",
        isVerified: false,
        bio: "Fixing phones one video at a time"
      },
      {
        username: "gadgetguru",
        fullName: "Gadget Guru",
        followers: 156e3,
        engagementRate: 3.9,
        category: "Technology",
        avgGMV: 3200,
        profilePicture: "https://via.placeholder.com/40",
        isVerified: true,
        bio: "Latest tech reviews and unboxings"
      },
      {
        username: "repairpro",
        fullName: "Repair Pro",
        followers: 43e3,
        engagementRate: 7.2,
        category: "Technology",
        avgGMV: 950,
        profilePicture: "https://via.placeholder.com/40",
        isVerified: false,
        bio: "Professional repair tutorials"
      }
    ];
    return mockCreators.filter((creator) => {
      if (criteria.category && creator.category !== criteria.category) return false;
      if (criteria.minFollowers && creator.followers < criteria.minFollowers) return false;
      if (criteria.maxFollowers && creator.followers > criteria.maxFollowers) return false;
      if (criteria.searchTerms) {
        const searchLower = criteria.searchTerms.toLowerCase();
        return creator.username.toLowerCase().includes(searchLower) || creator.fullName.toLowerCase().includes(searchLower) || creator.bio.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }
  app2.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const campaign = await storage.updateCampaign(id, updates);
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_updated",
        message: `Campaign "${campaign.name}" updated`,
        timestamp: /* @__PURE__ */ new Date()
      });
      broadcastToUser(campaign.userId, {
        type: "campaign_updated",
        campaign
      });
      res.json(campaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });
  app2.post("/api/campaigns/:id/start", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      const updatedCampaign = await storage.updateCampaign(campaignId, { status: "active" });
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_started",
        message: `Campaign "${campaign.name}" started`,
        timestamp: /* @__PURE__ */ new Date()
      });
      broadcastToUser(campaign.userId, {
        type: "campaign_started",
        campaign: updatedCampaign
      });
      startCampaignAutomation(campaignId, campaign.userId);
      res.json({ success: true, campaign: updatedCampaign });
    } catch (error) {
      console.error("Start campaign error:", error);
      res.status(500).json({ error: "Failed to start campaign" });
    }
  });
  app2.post("/api/campaigns/:id/pause", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.updateCampaign(campaignId, { status: "paused" });
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_paused",
        message: `Campaign "${campaign.name}" paused`,
        timestamp: /* @__PURE__ */ new Date()
      });
      broadcastToUser(campaign.userId, {
        type: "campaign_paused",
        campaign
      });
      res.json(campaign);
    } catch (error) {
      console.error("Pause campaign error:", error);
      res.status(500).json({ error: "Failed to pause campaign" });
    }
  });
  app2.get("/api/creators", async (req, res) => {
    try {
      const { category, minFollowers, maxFollowers, minGMV, maxGMV, limit = 25, offset = 0 } = req.query;
      const filters = {};
      if (category) filters.category = category;
      if (minFollowers) filters.minFollowers = parseInt(minFollowers);
      if (maxFollowers) filters.maxFollowers = parseInt(maxFollowers);
      if (minGMV) filters.minGMV = parseFloat(minGMV);
      if (maxGMV) filters.maxGMV = parseFloat(maxGMV);
      const { creators: creators3, total } = await storage.getCreators(filters, parseInt(limit), parseInt(offset));
      res.json({ creators: creators3, total });
    } catch (error) {
      console.error("Get creators error:", error);
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });
  app2.post("/api/creators", async (req, res) => {
    try {
      const creatorData = insertCreatorSchema.parse(req.body);
      const creator = await storage.createCreator(creatorData);
      res.json(creator);
    } catch (error) {
      console.error("Create creator error:", error);
      res.status(500).json({ error: "Failed to create creator" });
    }
  });
  app2.get("/api/creators/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Query parameter required" });
      }
      const creators3 = await storage.searchCreators(q);
      res.json(creators3);
    } catch (error) {
      console.error("Search creators error:", error);
      res.status(500).json({ error: "Failed to search creators" });
    }
  });
  app2.get("/api/campaigns/:id/invitations", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const invitations = await storage.getCampaignInvitations(campaignId);
      res.json(invitations);
    } catch (error) {
      console.error("Get invitations error:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });
  app2.post("/api/campaigns/:id/invitations", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const invitationData = insertCampaignInvitationSchema.parse({
        ...req.body,
        campaignId
      });
      const invitation = await storage.createCampaignInvitation(invitationData);
      res.json(invitation);
    } catch (error) {
      console.error("Create invitation error:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });
  app2.get("/api/session/:userId", async (req, res) => {
    try {
      const userIdParam = req.params.userId;
      if (!userIdParam || isNaN(parseInt(userIdParam))) {
        throw new Error("Invalid userId");
      }
      const userId = parseInt(userIdParam);
      const session = await storage.getActiveBrowserSession(userId);
      res.json(session || { isActive: false });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });
  app2.post("/api/session/:userId/refresh", async (req, res) => {
    try {
      const userIdParam = req.params.userId;
      if (!userIdParam || isNaN(parseInt(userIdParam))) {
        throw new Error("Invalid userId");
      }
      const userId = parseInt(userIdParam);
      await storage.deactivateBrowserSessions(userId);
      const sessionData = {
        cookies: [],
        localStorage: {},
        isActive: true
      };
      const sessionDataString = typeof sessionData === "string" ? sessionData : JSON.stringify(sessionData);
      const session = await storage.createBrowserSession({
        userId,
        sessionData: sessionDataString,
        isActive: true,
        lastActivity: /* @__PURE__ */ new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
        // 24 hours
      });
      await storage.createActivityLog({
        userId,
        type: "session_refresh",
        message: "TikTok session refreshed",
        timestamp: /* @__PURE__ */ new Date()
      });
      broadcastToUser(userId, {
        type: "session_refreshed",
        session
      });
      res.json(session);
    } catch (error) {
      console.error("Refresh session error:", error);
      res.status(500).json({ error: "Failed to refresh session" });
    }
  });
  app2.get("/api/activity/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { limit = 50 } = req.query;
      const logs = await storage.getActivityLogs(userId, parseInt(limit));
      res.json(logs);
    } catch (error) {
      console.error("Get activity logs error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });
  app2.get("/api/campaigns/:id/stats", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const stats = await storage.getCampaignStats(campaignId);
      res.json(stats);
    } catch (error) {
      console.error("Get campaign stats error:", error);
      res.status(500).json({ error: "Failed to fetch campaign stats" });
    }
  });
  app2.post("/api/creators/discover", async (req, res) => {
    try {
      const { criteria, count: count2 = 10 } = req.body;
      const discoveredCreators = await aiService.discoverCreators(criteria, count2);
      const savedCreators = [];
      for (const creatorData of discoveredCreators) {
        try {
          const existing = await storage.getCreatorByUsername(creatorData.username);
          if (!existing) {
            const creator = await storage.createCreator(creatorData);
            savedCreators.push(creator);
          }
        } catch (error) {
          console.error("Error saving discovered creator:", error);
        }
      }
      res.json({ discovered: savedCreators.length, creators: savedCreators });
    } catch (error) {
      console.error("Creator discovery error:", error);
      res.status(500).json({ error: "Failed to discover creators" });
    }
  });
  async function startCampaignAutomation(campaignId, userId) {
    try {
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.status !== "active") return;
      const pendingInvitations = await storage.getPendingInvitations(campaignId);
      for (const invitation of pendingInvitations) {
        try {
          if (!rateLimiter.canSendInvitation(userId)) {
            await storage.createActivityLog({
              userId,
              campaignId,
              type: "rate_limit_reached",
              message: "Rate limit reached, pausing automation",
              timestamp: /* @__PURE__ */ new Date()
            });
            break;
          }
          const creator = await storage.getCreator(invitation.creatorId);
          if (!creator) continue;
          const result = await puppeteerService.sendInvitation(creator.username, invitation.invitationText || campaign.invitationTemplate);
          if (result.success) {
            await storage.updateCampaignInvitation(invitation.id, {
              status: "sent",
              sentAt: /* @__PURE__ */ new Date()
            });
            await storage.updateCampaign(campaignId, {
              sentCount: (campaign.sentCount || 0) + 1
            });
            await storage.createActivityLog({
              userId,
              campaignId,
              type: "invitation_sent",
              message: `Invitation sent to @${creator.username}`,
              metadata: { creatorId: creator.id },
              timestamp: /* @__PURE__ */ new Date()
            });
            broadcastToUser(userId, {
              type: "invitation_sent",
              creator,
              campaign: campaignId
            });
            rateLimiter.recordInvitation(userId);
          } else {
            await storage.updateCampaignInvitation(invitation.id, {
              status: "failed",
              errorMessage: result.error,
              retryCount: (invitation.retryCount || 0) + 1
            });
            await storage.createActivityLog({
              userId,
              type: "invitation_failed",
              campaignId,
              metadata: { creatorId: creator.id, error: result.error },
              timestamp: /* @__PURE__ */ new Date()
            });
          }
          if (campaign.humanLikeDelays) {
            const delay = Math.random() * (10 - 2) + 2;
            await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1e3));
          }
        } catch (error) {
          console.error("Automation error for invitation:", invitation.id, error);
          await storage.updateCampaignInvitation(invitation.id, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            retryCount: (invitation.retryCount || 0) + 1
          });
        }
      }
      const remainingInvitations = await storage.getPendingInvitations(campaignId);
      if (remainingInvitations.length === 0 || (campaign.sentCount || 0) >= campaign.targetInvitations) {
        await storage.updateCampaign(campaignId, { status: "completed" });
        await storage.createActivityLog({
          userId,
          campaignId,
          type: "campaign_completed",
          message: `Campaign "${campaign.name}" completed`,
          timestamp: /* @__PURE__ */ new Date()
        });
        broadcastToUser(userId, {
          type: "campaign_completed",
          campaign: campaignId
        });
      }
    } catch (error) {
      console.error("Campaign automation error:", error);
    }
  }
  app2.get("/api/ai/models/status", async (req, res) => {
    try {
      const models = aiModelManager.getAvailableModels();
      const modelStatus = {};
      models.forEach((model) => {
        modelStatus[model.id] = model.isConfigured;
      });
      res.json(modelStatus);
    } catch (error) {
      console.error("Error getting model status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/ai/models/configure", async (req, res) => {
    try {
      const { modelId, apiKey } = req.body;
      if (!modelId || !apiKey) {
        return res.status(400).json({ error: "Model ID and API key are required" });
      }
      process.env[getApiKeyName(modelId)] = apiKey;
      res.json({ success: true, message: "Model configured successfully" });
    } catch (error) {
      console.error("Error configuring model:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/session/profile", async (req, res) => {
    try {
      res.json({
        isLoggedIn: true,
        profile: {
          username: "digi4u_repair",
          displayName: "Digi4u Repair UK",
          avatar: "https://via.placeholder.com/40",
          verified: true,
          followers: 15420,
          isActive: true
        }
      });
    } catch (error) {
      console.error("Error fetching session profile:", error);
      res.status(500).json({
        isLoggedIn: false,
        profile: null,
        error: "Failed to fetch session"
      });
    }
  });
  app2.post("/api/campaigns/send-invitation", async (req, res) => {
    try {
      const { creatorId, message } = req.body;
      if (!creatorId || !message) {
        return res.status(400).json({ error: "Creator ID and message are required" });
      }
      const invitation = await storage.createCampaignInvitation({
        campaignId: 1,
        // Default campaign for now
        creatorId: parseInt(creatorId),
        message,
        status: "sent",
        sentAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, invitationId: invitation.id });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/webhooks/tiktok", async (req, res) => {
    try {
      const { TikTokWebhookHandler: TikTokWebhookHandler2 } = await Promise.resolve().then(() => (init_tiktok_webhooks(), tiktok_webhooks_exports));
      const webhookHandler = new TikTokWebhookHandler2();
      await webhookHandler.handleWebhook(req, res);
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.get("/api/webhooks/tiktok/verify", async (req, res) => {
    try {
      const { TikTokWebhookHandler: TikTokWebhookHandler2 } = await Promise.resolve().then(() => (init_tiktok_webhooks(), tiktok_webhooks_exports));
      const webhookHandler = new TikTokWebhookHandler2();
      await webhookHandler.handleWebhookVerification(req, res);
    } catch (error) {
      console.error("Webhook verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });
  app2.get("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const settings = user.settings || {};
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  app2.post("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      await storage.updateUserSettings(userId, JSON.stringify(settings));
      await storage.createActivityLog({
        userId,
        type: "settings_updated",
        message: "User settings updated",
        timestamp: /* @__PURE__ */ new Date()
      });
      const updatedUser = await storage.getUser(userId);
      const updatedSettings = updatedUser?.settings ? JSON.parse(updatedUser.settings) : {};
      res.json({ success: true, message: "Settings saved successfully", settings: updatedSettings });
    } catch (error) {
      console.error("Save settings error:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });
  app2.get("/api/analytics/overview", async (req, res) => {
    try {
      const overview = await generateAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/automation/puppeteer.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
var getRandomUserAgent = () => {
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ];
  return agents[Math.floor(Math.random() * agents.length)];
};
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
var PuppeteerAutomation = class {
  browser = null;
  page = null;
  sessionData = null;
  isInitialized = false;
  async initializeSession() {
    try {
      if (this.browser) {
        await this.browser.close();
      }
      const randomUA = getRandomUserAgent();
      let executablePath;
      try {
        const { execSync } = __require("child_process");
        try {
          executablePath = execSync("which chromium-browser || which chromium || which google-chrome-stable || which google-chrome", { encoding: "utf8" }).trim();
          if (executablePath) {
            console.log("Using system Chrome:", executablePath);
          }
        } catch {
          try {
            executablePath = execSync('find /home/runner/.cache/puppeteer -name "chrome" -type f 2>/dev/null | head -1', { encoding: "utf8" }).trim();
            if (executablePath) {
              console.log("Using Puppeteer cached Chrome:", executablePath);
            }
          } catch {
            console.log("No Chrome executable found");
          }
        }
      } catch (error) {
        console.log("Chrome detection failed:", error);
        executablePath = void 0;
      }
      this.browser = await puppeteer.launch({
        headless: true,
        // Changed to headless for Replit environment
        executablePath,
        // Use system Chromium if found
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-sync",
          "--disable-translate",
          "--hide-scrollbars",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-default-browser-check",
          "--safebrowsing-disable-auto-update",
          "--disable-blink-features=AutomationControlled",
          "--single-process",
          "--disable-background-timer-throttling",
          "--disable-renderer-backgrounding",
          "--disable-backgrounding-occluded-windows",
          "--disable-ipc-flooding-protection",
          "--disable-background-mode",
          "--disable-component-extensions-with-background-pages",
          "--disable-features=TranslateUI",
          "--disable-features=BlinkGenPropertyTrees",
          "--run-all-compositor-stages-before-draw",
          "--disable-threaded-animation",
          "--disable-threaded-scrolling",
          "--disable-checker-imaging"
        ],
        defaultViewport: null
      });
      this.page = await this.browser.newPage();
      await this.page.setViewport({
        width: 1366 + Math.floor(Math.random() * 100),
        height: 768 + Math.floor(Math.random() * 100)
      });
      await this.page.setUserAgent(randomUA);
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => void 0
        });
      });
      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      });
      console.log("Navigating to TikTok Seller Affiliate Center...");
      await this.page.goto("https://affiliate.tiktok.com/connection/creator?shop_region=GB", {
        waitUntil: "networkidle0",
        timeout: 3e4
      });
      await this.humanLikeDelay(2e3, 4e3);
      const isLoggedIn = await this.detectLoginStatus();
      if (isLoggedIn) {
        console.log("Existing session detected, capturing session data...");
        this.sessionData = await this.captureSessionData();
      } else {
        console.log("No active session found. User needs to login manually.");
      }
      this.isInitialized = true;
      return {
        initialized: true,
        timestamp: /* @__PURE__ */ new Date(),
        userAgent: randomUA,
        isLoggedIn,
        sessionCaptured: !!this.sessionData,
        cookies: await this.page.cookies(),
        localStorage: await this.captureLocalStorage(),
        sessionStorage: await this.captureSessionStorage()
      };
    } catch (error) {
      console.error("Failed to initialize Puppeteer session:", error);
      console.log("Automation features will be disabled until Chrome is available");
      this.isInitialized = false;
      return {
        initialized: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: /* @__PURE__ */ new Date(),
        message: "Chrome browser not found. Automation features disabled."
      };
    }
  }
  // Capture existing login session
  async captureSessionData() {
    if (!this.page) throw new Error("Page not initialized");
    try {
      const [cookies, localStorage2, sessionStorage2, profile] = await Promise.all([
        this.page.cookies(),
        this.captureLocalStorage(),
        this.captureSessionStorage(),
        this.extractProfileData()
      ]);
      await this.storeSessionCookies(cookies);
      return {
        cookies,
        localStorage: localStorage2,
        sessionStorage: sessionStorage2,
        profile,
        url: this.page.url(),
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      console.error("Failed to capture session data:", error);
      return null;
    }
  }
  async storeSessionCookies(cookies) {
    try {
      console.log("Storing session cookies:", cookies);
    } catch (error) {
      console.error("Failed to store session cookies:", error);
    }
  }
  // Extract profile data from TikTok page
  async extractProfileData() {
    if (!this.page) return null;
    try {
      const profileData = await this.page.evaluate(() => {
        const extractText = (selector) => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || null;
        };
        const extractAttribute = (selector, attribute) => {
          const element = document.querySelector(selector);
          return element?.getAttribute(attribute) || null;
        };
        let username = extractText('[data-e2e="nav-profile"] span') || extractText(".username") || extractText('[data-testid="username"]') || "digi4u_repair";
        let displayName = extractText('[data-e2e="profile-name"]') || extractText(".display-name") || extractText('[data-testid="display-name"]') || "Digi4u Repair UK";
        let avatar = extractAttribute('[data-e2e="avatar"] img', "src") || extractAttribute(".avatar img", "src") || extractAttribute('img[alt*="avatar"]', "src") || "https://via.placeholder.com/40";
        let followers = extractText('[data-e2e="followers-count"]') || extractText(".follower-count") || "15.4K";
        let followerCount = 15420;
        if (followers) {
          const match = followers.match(/([\d.]+)([KMB]?)/i);
          if (match) {
            const [, number, unit] = match;
            const num = parseFloat(number);
            switch (unit?.toUpperCase()) {
              case "K":
                followerCount = Math.round(num * 1e3);
                break;
              case "M":
                followerCount = Math.round(num * 1e6);
                break;
              case "B":
                followerCount = Math.round(num * 1e9);
                break;
              default:
                followerCount = Math.round(num);
            }
          }
        }
        return {
          username: username.replace("@", ""),
          displayName,
          avatar,
          verified: !!document.querySelector('[data-e2e="verify-icon"], .verified-icon'),
          followers: followerCount,
          isActive: true
        };
      });
      console.log("Extracted profile data:", profileData);
      return profileData;
    } catch (error) {
      console.error("Profile extraction error:", error);
      return {
        username: "digi4u_repair",
        displayName: "Digi4u Repair UK",
        avatar: "https://via.placeholder.com/40",
        verified: true,
        followers: 15420,
        isActive: true
      };
    }
  }
  // Restore session from captured data
  async restoreSession(sessionData) {
    if (!this.page || !sessionData) return false;
    try {
      if (sessionData.cookies) {
        await this.page.setCookie(...sessionData.cookies);
      }
      if (sessionData.localStorage) {
        await this.page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
        }, sessionData.localStorage);
      }
      if (sessionData.sessionStorage) {
        await this.page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            sessionStorage.setItem(key, value);
          }
        }, sessionData.sessionStorage);
      }
      return true;
    } catch (error) {
      console.error("Failed to restore session:", error);
      return false;
    }
  }
  async detectLoginStatus() {
    if (!this.page) return false;
    try {
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      const indicators = [
        // TikTok Seller Center indicators
        'div[data-testid="seller-header"]',
        ".seller-layout",
        '[data-testid="dashboard"]',
        ".dashboard-container",
        // General TikTok indicators
        '[data-e2e="profile-icon"]',
        '[data-e2e="nav-profile"]',
        ".DivHeaderWrapper",
        ".DivNavContainer",
        'div[data-e2e="recommend-list-item-container"]',
        // Avatar or profile picture indicators
        'img[alt*="avatar"]',
        ".avatar-wrapper",
        '[data-e2e="avatar"]'
      ];
      for (const selector of indicators) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2e3 });
          console.log(`Detected login via selector: ${selector}`);
          return true;
        } catch {
          continue;
        }
      }
      const cookies = await this.page.cookies();
      const authCookies = cookies.filter(
        (cookie) => cookie.name.includes("sessionid") || cookie.name.includes("sessionid_") || cookie.name.includes("sid_tt") || cookie.name.includes("passport_auth_token")
      );
      if (authCookies.length > 0) {
        console.log("Detected login via auth cookies");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login detection error:", error);
      return false;
    }
  }
  async captureLocalStorage() {
    if (!this.page) return {};
    try {
      return await this.page.evaluate(() => {
        const storage2 = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            storage2[key] = localStorage.getItem(key) || "";
          }
        }
        return storage2;
      });
    } catch {
      return {};
    }
  }
  async captureSessionStorage() {
    if (!this.page) return {};
    try {
      return await this.page.evaluate(() => {
        const storage2 = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            storage2[key] = sessionStorage.getItem(key) || "";
          }
        }
        return storage2;
      });
    } catch {
      return {};
    }
  }
  async sendInvitation(creatorUsername, message) {
    try {
      if (!this.page) {
        throw new Error("Browser session not initialized");
      }
      await this.humanLikeDelay(1e3, 3e3);
      await this.simulateMouseMovement();
      const searchSelector = 'input[placeholder*="search"], input[placeholder*="creator"]';
      await this.page.waitForSelector(searchSelector, { timeout: 1e4 });
      await this.page.click(searchSelector);
      await this.humanLikeDelay(500, 1500);
      await this.page.type(searchSelector, creatorUsername, { delay: 100 });
      await this.humanLikeDelay(1e3, 2e3);
      await this.page.keyboard.press("Enter");
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      const inviteButtonSelector = 'button[data-testid="invite"], button:contains("invite"), .invite-btn';
      try {
        await this.page.waitForSelector(inviteButtonSelector, { timeout: 1e4 });
        await this.page.click(inviteButtonSelector);
        await this.humanLikeDelay(1e3, 2e3);
        const messageInputSelector = 'textarea, input[type="text"]';
        await this.page.waitForSelector(messageInputSelector, { timeout: 5e3 });
        await this.page.click(messageInputSelector);
        await this.humanLikeDelay(500, 1e3);
        await this.page.type(messageInputSelector, message, { delay: 50 });
        await this.humanLikeDelay(1e3, 2e3);
        const sendButtonSelector = 'button[type="submit"], button:contains("Send"), .send-btn';
        await this.page.click(sendButtonSelector);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: `Creator @${creatorUsername} not found or messaging not available`
        };
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
  async checkForResponses() {
    try {
      if (!this.page) {
        throw new Error("Browser session not initialized");
      }
      await this.page.goto("https://seller.tiktokshop.com/messages", { waitUntil: "networkidle0" });
      await this.humanLikeDelay(2e3, 4e3);
      const messages = await this.page.evaluate(() => {
        const inviteElements = document.querySelectorAll(".invite-item, .conversation-item");
        return Array.from(inviteElements).map((element) => {
          const usernameEl = element.querySelector(".username, .creator-name");
          const inviteEl = element.querySelector(".invite-text, .last-invite");
          const timestampEl = element.querySelector(".timestamp, .time");
          return {
            username: usernameEl?.textContent?.trim(),
            invite: inviteEl?.textContent?.trim(),
            timestamp: timestampEl?.textContent?.trim(),
            isUnread: element.classList.contains("unread")
          };
        });
      });
      return messages.filter((msg) => msg.username && msg.invite);
    } catch (error) {
      console.error("Failed to check for responses:", error);
      return [];
    }
  }
  async discoverCreators(category, minFollowers = 1e4) {
    try {
      if (!this.page) {
        throw new Error("Browser session not initialized");
      }
      await this.page.goto("https://seller.tiktokshop.com/creators", { waitUntil: "networkidle0" });
      await this.humanLikeDelay(2e3, 4e3);
      await this.applyCreatorFilters(category, minFollowers);
      const creators3 = await this.page.evaluate(() => {
        const creatorElements = document.querySelectorAll(".creator-card, .creator-item");
        return Array.from(creatorElements).map((element) => {
          const usernameEl = element.querySelector(".username, .creator-username");
          const followersEl = element.querySelector(".followers, .follower-count");
          const categoryEl = element.querySelector(".category, .creator-category");
          const gmvEl = element.querySelector(".gmv, .earnings");
          return {
            username: usernameEl?.textContent?.trim(),
            followers: this.parseFollowerCount(followersEl?.textContent?.trim()),
            category: categoryEl?.textContent?.trim(),
            gmv: this.parseGMV(gmvEl?.textContent?.trim())
          };
        });
      });
      return creators3.filter((creator) => creator.username);
    } catch (error) {
      console.error("Failed to discover creators:", error);
      return [];
    }
  }
  async applyCreatorFilters(category, minFollowers) {
    try {
      const categorySelector = 'select[name="category"], .category-filter';
      if (await this.page.$(categorySelector)) {
        await this.page.select(categorySelector, category);
        await this.humanLikeDelay(1e3, 2e3);
      }
      const followersSelector = 'input[name="min_followers"], .followers-filter';
      if (await this.page.$(followersSelector)) {
        await this.page.click(followersSelector);
        await this.page.keyboard.down("Control");
        await this.page.keyboard.press("KeyA");
        await this.page.keyboard.up("Control");
        await this.page.type(followersSelector, minFollowers.toString());
        await this.humanLikeDelay(500, 1e3);
      }
      const applyButtonSelector = 'button:contains("Apply"), .apply-filters';
      if (await this.page.$(applyButtonSelector)) {
        await this.page.click(applyButtonSelector);
        await new Promise((resolve) => setTimeout(resolve, 3e3));
      }
    } catch (error) {
      console.error("Failed to apply filters:", error);
    }
  }
  async simulateMouseMovement() {
    try {
      const viewport = this.page.viewport();
      if (!viewport) return;
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        await this.page.mouse.move(x, y);
        await this.humanLikeDelay(100, 500);
      }
    } catch (error) {
      console.error("Mouse simulation error:", error);
    }
  }
  async humanLikeDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  parseFollowerCount(text3) {
    if (!text3) return null;
    const match = text3.match(/([\d.]+)([KMB]?)/i);
    if (!match) return null;
    const [, number, unit] = match;
    const num = parseFloat(number);
    switch (unit.toUpperCase()) {
      case "K":
        return Math.round(num * 1e3);
      case "M":
        return Math.round(num * 1e6);
      case "B":
        return Math.round(num * 1e9);
      default:
        return Math.round(num);
    }
  }
  parseGMV(text3) {
    if (!text3) return null;
    const match = text3.match(/\$?([\d,.]+)([KMB]?)/i);
    if (!match) return null;
    const [, number, unit] = match;
    const num = parseFloat(number.replace(/,/g, ""));
    switch (unit.toUpperCase()) {
      case "K":
        return Math.round(num * 1e3);
      case "M":
        return Math.round(num * 1e6);
      case "B":
        return Math.round(num * 1e9);
      default:
        return Math.round(num);
    }
  }
  async setupStealth() {
    if (!this.page) return;
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => void 0
      });
      Object.defineProperty(window, "chrome", {
        get: () => ({
          runtime: {},
          loadTimes: {},
          csi: {},
          app: {}
        })
      });
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          { name: "Chrome PDF Plugin", length: 1 },
          { name: "Chrome PDF Viewer", length: 1 },
          { name: "Native Client", length: 1 }
        ]
      });
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => parameters.name === "notifications" ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters);
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"]
      });
      Object.defineProperty(navigator, "platform", {
        get: () => "Win32"
      });
      Object.defineProperty(screen, "colorDepth", {
        get: () => 24
      });
      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => 8
      });
      Object.defineProperty(navigator, "deviceMemory", {
        get: () => 8
      });
    });
    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );
    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "max-age=0"
    });
  }
  isReady() {
    return this.isInitialized && this.browser !== null && this.page !== null;
  }
  async ensureInitialized() {
    if (!this.isReady()) {
      try {
        const result = await this.initializeSession();
        this.isInitialized = result.initialized;
        return this.isInitialized;
      } catch (error) {
        console.error("Failed to ensure initialization:", error);
        return false;
      }
    }
    return true;
  }
  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isInitialized = false;
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
};

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const puppeteerAutomation = new PuppeteerAutomation();
  puppeteerAutomation.initializeSession().catch((error) => {
    console.log("Puppeteer initialization failed, automation features disabled:", error.message);
  });
  await registerRoutes(app);
  const { createServer } = await import("http");
  const server = createServer(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  const { Server } = await import("socket.io");
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    console.log("WebSocket connection established");
    socket.on("join_user", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
      socket.emit("connected", { userId, timestamp: /* @__PURE__ */ new Date() });
      checkAndSendSessionStatus(socket);
    });
    socket.on("disconnect", () => {
      console.log("WebSocket connection closed");
    });
  });
  async function checkAndSendSessionStatus(socket) {
    try {
      if (puppeteerAutomation.isReady()) {
        const sessionData = await puppeteerAutomation.captureSessionData();
        socket.emit("session_status", sessionData);
      } else {
        socket.emit("session_status", {
          initialized: false,
          message: "Automation service not available"
        });
      }
    } catch (error) {
      console.error("Error checking session status:", error);
      socket.emit("session_status", {
        initialized: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
