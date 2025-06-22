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
} from '../shared/schema';
import { db, getDatabase } from "./db";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
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
  ): Promise<{ creators: Creator[]; total: number }>;
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
  storeTikTokTokens(userId: number, tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
  }): Promise<void>;
  getTikTokTokens(userId: number): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
  } | null>;
}

export class DatabaseStorage implements IStorage {
  private get db() {
    return getDatabase();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserTikTokSession(
    userId: number,
    sessionData: any,
  ): Promise<void> {
    await this.db
      .update(users)
      .set({ tiktokSession: sessionData, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getUserSettings(userId: number) {
    try {
      const user = await this.db
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
      const result = await this.db
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
    return await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await this.db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(
    id: number,
    updates: Partial<Campaign>,
  ): Promise<Campaign> {
    const [updatedCampaign] = await this.db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    await this.db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Creators
  async getCreators(filters?: any, limit = 25, offset = 0): Promise<{ creators: Creator[]; total: number }> {
    let query = this.db.select().from(creators);
    let countQuery = this.db.select({ count: count() }).from(creators);

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
    const creatorsList = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(creators.followers));
    return { creators: creatorsList, total };
  }

  async getCreator(id: number): Promise<Creator | undefined> {
    const [creator] = await this.db
      .select()
      .from(creators)
      .where(eq(creators.id, id));
    return creator || undefined;
  }

  async getCreatorByUsername(username: string): Promise<Creator | undefined> {
    const [creator] = await this.db
      .select()
      .from(creators)
      .where(eq(creators.username, username));
    return creator || undefined;
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    const [newCreator] = await this.db.insert(creators).values(creator).returning();
    return newCreator;
  }

  async updateCreator(id: number, updates: Partial<Creator>): Promise<Creator> {
    const [updatedCreator] = await this.db
      .update(creators)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(creators.id, id))
      .returning();
    return updatedCreator;
  }

  async searchCreators(query: string): Promise<Creator[]> {
    return await this.db
      .select()
      .from(creators)
      .where(
        sql`${creators.username} ILIKE ${`%${query}%`} OR ${creators.displayName} ILIKE ${`%${query}%`}`,
      )
      .limit(50);
  }

  async updateCreatorStats(creatorId: number, stats: any): Promise<void> {
    await this.db
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
    await this.db
      .update(creators)
      .set({ engagementRate })
      .where(eq(creators.id, creatorId));
  }

  async updateCreatorFollowers(
    creatorId: number,
    followers: number,
  ): Promise<void> {
    await this.db
      .update(creators)
      .set({ followers })
      .where(eq(creators.id, creatorId));
  }

  async getCampaignInvitationByCreator(
    campaignId: number,
    creatorId: number,
  ): Promise<CampaignInvitation | null> {
    const results = await this.db
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
    return await this.db
      .select()
      .from(campaignInvitations)
      .where(eq(campaignInvitations.campaignId, campaignId))
      .orderBy(desc(campaignInvitations.createdAt));
  }

  async createCampaignInvitation(
    invitation: InsertCampaignInvitation,
  ): Promise<CampaignInvitation> {
    const [newInvitation] = await this.db
      .insert(campaignInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async updateCampaignInvitation(
    id: number,
    updates: Partial<CampaignInvitation>,
  ): Promise<CampaignInvitation> {
    const [updatedInvitation] = await this.db
      .update(campaignInvitations)
      .set(updates)
      .where(eq(campaignInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async getPendingInvitations(
    campaignId: number,
  ): Promise<CampaignInvitation[]> {
    return await this.db
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
    try {
      // Ensure userId is a valid number
      if (!userId || isNaN(userId)) {
        return undefined;
      }

      const [session] = await this.db
        .select()
        .from(browserSessions)
        .where(
          and(
            eq(browserSessions.userId, Number(userId)),
            eq(browserSessions.isActive, 1), // Use 1 instead of true for SQLite
          ),
        )
        .orderBy(desc(browserSessions.lastActivity))
        .limit(1);
      return session || undefined;
    } catch (error) {
      console.error('Error fetching active browser session:', error);
      return undefined;
    }
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
    const [newSession] = await this.db
      .insert(browserSessions)
      .values(sessionWithTimestamp)
      .returning();
    return newSession;
  }

  async updateBrowserSession(
    id: number,
    updates: Partial<BrowserSession>,
  ): Promise<BrowserSession> {
    const [updatedSession] = await this.db
      .update(browserSessions)
      .set(updates)
      .where(eq(browserSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deactivateBrowserSessions(userId: number): Promise<void> {
    await this.db
      .update(browserSessions)
      .set({ isActive: false })
      .where(eq(browserSessions.userId, userId));
  }

  // Activity Logs
  async getActivityLogs(userId: number, limit = 50): Promise<ActivityLog[]> {
    return await this.db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await this.db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Analytics
  async getCampaignStats(campaignId: number): Promise<any> {
    const [sentCount] = await this.db
      .select({ count: count() })
      .from(campaignInvitations)
      .where(
        and(
          eq(campaignInvitations.campaignId, campaignId),
          eq(campaignInvitations.status, "sent"),
        ),
      );

    const [responseCount] = await this.db
      .select({ count: count() })
      .from(campaignInvitations)
      .where(
        and(
          eq(campaignInvitations.campaignId, campaignId),
          eq(campaignInvitations.status, "responded"),
        ),
      );

    const [pendingCount] = await this.db
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
    const userCampaigns = await this.db
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

  // TikTok token management
  async storeTikTokTokens(userId: number, tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
  }): Promise<void> {
    try {
      const tokenData = JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt.toISOString(),
        refreshExpiresAt: tokens.refreshExpiresAt.toISOString()
      });

      // Update existing session or create new one
      const existingSession = await this.getActiveBrowserSession(userId);
      if (existingSession) {
        await this.db.update(browserSessions)
          .set({
            sessionData: tokenData,
            lastActivity: new Date(),
            expiresAt: tokens.expiresAt
          })
          .where(eq(browserSessions.id, existingSession.id));
      } else {
        await this.db.insert(browserSessions).values({
          userId: userId,
          sessionData: tokenData,
          isActive: true,
          lastActivity: new Date(),
          expiresAt: tokens.expiresAt
        });
      }
    } catch (error) {
      console.error('Error storing TikTok tokens:', error);
      throw error;
    }
  }

  async getTikTokTokens(userId: number): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
  } | null> {
    const session = await this.getActiveBrowserSession(userId);
    if (!session || !session.sessionData) {
      return null;
    }

    try {
      const sessionDataString = typeof session.sessionData === 'string' 
        ? session.sessionData 
        : JSON.stringify(session.sessionData);
      const tokenData = JSON.parse(sessionDataString);

      if (!tokenData.accessToken || !tokenData.refreshToken) {
        return null;
      }

      return {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: new Date(tokenData.expiresAt),
        refreshExpiresAt: new Date(tokenData.refreshExpiresAt)
      };
    } catch (error) {
      console.error('Failed to parse token data:', error);
      return null;
    }
  }
}

export async function generateAnalyticsOverview() {
  return {
    totalCampaigns: 0,
    totalResponses: 0,
    totalConversions: 0,
    conversionRate: 0,
    avgGMVPerCreator: 0
  };
}

// Create and export storage instance
export const storage = new DatabaseStorage();