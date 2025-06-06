import {
  users,
  campaigns,
  creators,
  campaignInvitations,
  browserSessions,
  activityLogs,
  type User,
  type InsertUser,
  type Campaign,
  type InsertCampaign,
  type Creator,
  type InsertCreator,
  type CampaignInvitation,
  type InsertCampaignInvitation,
  type BrowserSession,
  type InsertBrowserSession,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTikTokSession(userId: number, sessionData: any): Promise<void>;

  // Campaigns
  getCampaigns(userId: number): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign>;
  deleteCampaign(id: number): Promise<void>;

  // Creators
  getCreators(
    filters?: any,
    limit?: number,
    offset?: number,
  ): Promise<Creator[]>;
  getCreator(id: number): Promise<Creator | undefined>;
  getCreatorByUsername(username: string): Promise<Creator | undefined>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: number, updates: Partial<Creator>): Promise<Creator>;
  searchCreators(query: string): Promise<Creator[]>;

  // Campaign Invitations
  getCampaignInvitations(campaignId: number): Promise<CampaignInvitation[]>;
  createCampaignInvitation(
    invitation: InsertCampaignInvitation,
  ): Promise<CampaignInvitation>;
  updateCampaignInvitation(
    id: number,
    updates: Partial<CampaignInvitation>,
  ): Promise<CampaignInvitation>;
  getPendingInvitations(campaignId: number): Promise<CampaignInvitation[]>;

  // Browser Sessions
  getActiveBrowserSession(userId: number): Promise<BrowserSession | undefined>;
  createBrowserSession(session: InsertBrowserSession): Promise<BrowserSession>;
  updateBrowserSession(
    id: number,
    updates: Partial<BrowserSession>,
  ): Promise<BrowserSession>;
  deactivateBrowserSessions(userId: number): Promise<void>;

  // Activity Logs
  getActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Analytics
  getCampaignStats(campaignId: number): Promise<any>;
  getDashboardStats(userId: number): Promise<any>;

  // User Settings
  getUserSettings(userId: number): Promise<any>;
  updateUserSettings(userId: number, settings: any): Promise<any>;

  // Creator Stats
  updateCreatorStats(creatorId: number, stats: any): Promise<void>;
  updateCreatorEngagement(creatorId: number, engagementRate: number): Promise<void>;
  updateCreatorFollowers(creatorId: number, followers: number): Promise<void>;
  getCampaignInvitationByCreator(campaignId: number, creatorId: number): Promise<CampaignInvitation | null>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserTikTokSession(
    userId: number,
    sessionData: any,
  ): Promise<void> {
    await db
      .update(users)
      .set({ tiktokSession: sessionData, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getUserSettings(userId: number) {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return user[0]?.settings || {};
    } catch (error) {
      console.error("Get user settings error:", error);
      return {};
    }
  }

  async updateUserSettings(userId: number, settings: any) {
    try {
      const result = await db
        .update(users)
        .set({ settings, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Update user settings error:", error);
      throw error;
    }
  }

  // Campaigns
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(
    id: number,
    updates: Partial<Campaign>,
  ): Promise<Campaign> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Creators
  async getCreators(filters?: any, limit = 25, offset = 0): Promise<Creator[]> {
    let query = db.select().from(creators);

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
      }
    }

    return await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(creators.followers));
  }

  async getCreator(id: number): Promise<Creator | undefined> {
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, id));
    return creator || undefined;
  }

  async getCreatorByUsername(username: string): Promise<Creator | undefined> {
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.username, username));
    return creator || undefined;
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    const [newCreator] = await db.insert(creators).values(creator).returning();
    return newCreator;
  }

  async updateCreator(id: number, updates: Partial<Creator>): Promise<Creator> {
    const [updatedCreator] = await db
      .update(creators)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(creators.id, id))
      .returning();
    return updatedCreator;
  }

  async searchCreators(query: string): Promise<Creator[]> {
    return await db
      .select()
      .from(creators)
      .where(
        sql`${creators.username} ILIKE ${`%${query}%`} OR ${creators.displayName} ILIKE ${`%${query}%`}`,
      )
      .limit(50);
  }

  async updateCreatorStats(creatorId: number, stats: any): Promise<void> {
    await db
      .update(creators)
      .set({
        lastActive: stats.lastActivity,
        engagementRate: stats.lastVideoEngagement || creators.engagementRate,
      })
      .where(eq(creators.id, creatorId));
  }

  async updateCreatorEngagement(
    creatorId: number,
    engagementRate: number,
  ): Promise<void> {
    await db
      .update(creators)
      .set({ engagementRate })
      .where(eq(creators.id, creatorId));
  }

  async updateCreatorFollowers(
    creatorId: number,
    followers: number,
  ): Promise<void> {
    await db
      .update(creators)
      .set({ followers })
      .where(eq(creators.id, creatorId));
  }

  async getCampaignInvitationByCreator(
    campaignId: number,
    creatorId: number,
  ): Promise<CampaignInvitation | null> {
    const results = await db
      .select()
      .from(campaignInvitations)
      .where(
        and(
          eq(campaignInvitations.campaignId, campaignId),
          eq(campaignInvitations.creatorId, creatorId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  // Campaign Invitations
  async getCampaignInvitations(
    campaignId: number,
  ): Promise<CampaignInvitation[]> {
    return await db
      .select()
      .from(campaignInvitations)
      .where(eq(campaignInvitations.campaignId, campaignId))
      .orderBy(desc(campaignInvitations.createdAt));
  }

  async createCampaignInvitation(
    invitation: InsertCampaignInvitation,
  ): Promise<CampaignInvitation> {
    const [newInvitation] = await db
      .insert(campaignInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async updateCampaignInvitation(
    id: number,
    updates: Partial<CampaignInvitation>,
  ): Promise<CampaignInvitation> {
    const [updatedInvitation] = await db
      .update(campaignInvitations)
      .set(updates)
      .where(eq(campaignInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async getPendingInvitations(
    campaignId: number,
  ): Promise<CampaignInvitation[]> {
    return await db
      .select()
      .from(campaignInvitations)
      .where(
        and(
          eq(campaignInvitations.campaignId, campaignId),
          eq(campaignInvitations.status, "pending"),
        ),
      )
      .orderBy(campaignInvitations.createdAt);
  }

  // Browser Sessions
  async getActiveBrowserSession(
    userId: number,
  ): Promise<BrowserSession | undefined> {
    const [session] = await db
      .select()
      .from(browserSessions)
      .where(
        and(
          eq(browserSessions.userId, userId),
          eq(browserSessions.isActive, true),
        ),
      )
      .orderBy(desc(browserSessions.lastActivity))
      .limit(1);
    return session || undefined;
  }

  async createBrowserSession(
    session: InsertBrowserSession,
  ): Promise<BrowserSession> {
    const sessionWithTimestamp = {
      ...session,
      lastActivity: new Date(),
      expiresAt:
        session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    const [newSession] = await db
      .insert(browserSessions)
      .values(sessionWithTimestamp)
      .returning();
    return newSession;
  }

  async updateBrowserSession(
    id: number,
    updates: Partial<BrowserSession>,
  ): Promise<BrowserSession> {
    const [updatedSession] = await db
      .update(browserSessions)
      .set(updates)
      .where(eq(browserSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deactivateBrowserSessions(userId: number): Promise<void> {
    await db
      .update(browserSessions)
      .set({ isActive: false })
      .where(eq(browserSessions.userId, userId));
  }

  // Activity Logs
  async getActivityLogs(userId: number, limit = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Analytics
  async getCampaignStats(campaignId: number): Promise<any> {
    const [sentCount] = await db
      .select({ count: count() })
      .from(campaignInvitations)
      .where(
        and(
          eq(campaignInvitations.campaignId, campaignId),
          eq(campaignInvitations.status, "sent"),
        ),
      );

    const [responseCount] = await db
      .select({ count: count() })
      .from(campaignInvitations)
      .where(
        and(
          eq(campaignInvitations.campaignId, campaignId),
          eq(campaignInvitations.status, "responded"),
        ),
      );

    const [pendingCount] = await db
      .select({ count: count() })
      .from(campaignInvitations)
      .where(
        and(
          eq(campaignInvitations.campaignId, campaignId),
          eq(campaignInvitations.status, "pending"),
        ),
      );

    return {
      sent: sentCount.count,
      responses: responseCount.count,
      pending: pendingCount.count,
      responseRate:
        sentCount.count > 0 ? (responseCount.count / sentCount.count) * 100 : 0,
    };
  }

  async getDashboardStats(userId: number): Promise<any> {
    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId));

    const activeCampaigns = userCampaigns.filter(
      (c) => c.status === "active",
    ).length;
    const totalSent = userCampaigns.reduce(
      (sum, c) => sum + (c.sentCount || 0),
      0,
    );
    const totalResponses = userCampaigns.reduce(
      (sum, c) => sum + (c.responseCount || 0),
      0,
    );
    const responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0;

    return {
      activeCampaigns,
      creatorsContacted: totalSent,
      responseRate,
      totalGMV: 847293, // This would be calculated from actual conversions
    };
  }
}

export const storage = new DatabaseStorage();
