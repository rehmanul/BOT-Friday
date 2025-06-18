
import { Express } from "express";
import { storage } from "./storage";
import { insertCampaignSchema, insertCampaignInvitationSchema } from "../shared/schema";
import { aiModelManager } from "./ai/ai-model-manager";
import { aiService } from "./automation/ai-service";
import { generateAnalyticsOverview } from "./storage";

let broadcastFunction: ((userId: number, message: any) => void) | null = null;

export function setBroadcastFunction(fn: (userId: number, message: any) => void) {
  broadcastFunction = fn;
}

export async function registerRoutes(app: Express) {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Session profile endpoint
  app.get("/api/session/profile", (req, res) => {
    // Return mock profile data for now
    res.json({
      profile: {
        username: "user",
        displayName: "User",
        avatar: "https://via.placeholder.com/40"
      }
    });
  });

  // Session endpoint with userId
  app.get("/api/session/:userId", async (req, res) => {
    try {
      const userIdParam = req.params.userId;
      if (!userIdParam || isNaN(parseInt(userIdParam))) {
        return res.status(400).json({ error: "Invalid userId" });
      }
      const userId = parseInt(userIdParam);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", (req, res) => {
    res.json({
      overview: {
        totalCampaigns: 0,
        totalResponses: 0,
        totalConversions: 0,
        conversionRate: 0,
        avgGMVPerCreator: 0
      },
      topCategories: []
    });
  });

  // Analytics overview endpoint
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const overview = await generateAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Creators endpoint
  app.get("/api/creators", (req, res) => {
    res.json([]);
  });

  // Creators search endpoint
  app.get("/api/creators/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Query parameter required" });
      }
      const creators = await storage.searchCreators(q as string);
      res.json(creators);
    } catch (error) {
      console.error("Search creators error:", error);
      res.status(500).json({ error: "Failed to search creators" });
    }
  });

  // Creator discovery endpoint
  app.post("/api/creators/discover", async (req, res) => {
    try {
      const { criteria, count = 10 } = req.body;
      const discoveredCreators = await aiService.discoverCreators(criteria, count);
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
      res.json(savedCreators);
    } catch (error) {
      console.error("Creator discovery error:", error);
      res.status(500).json({ error: "Failed to discover creators" });
    }
  });

  // Campaigns endpoint
  app.get("/api/campaigns", (req, res) => {
    res.json([]);
  });

  // User campaigns endpoint
  app.get("/api/campaigns/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Create campaign endpoint
  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData);
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_created",
        message: `Campaign "${campaign.name}" created`,
        timestamp: new Date()
      });
      res.json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Campaign stats endpoint
  app.get("/api/campaigns/:id/stats", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const stats = await storage.getCampaignStats(campaignId);
      res.json(stats);
    } catch (error) {
      console.error("Get campaign stats error:", error);
      res.status(500).json({ error: "Failed to fetch campaign stats" });
    }
  });

  // Campaign invitations endpoints
  app.get("/api/campaigns/:id/invitations", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const invitations = await storage.getCampaignInvitations(campaignId);
      res.json(invitations);
    } catch (error) {
      console.error("Get invitations error:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.post("/api/campaigns/:id/invitations", async (req, res) => {
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

  // Send invitation endpoint
  app.post("/api/invitations/:id/send", async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      // TODO: Implement invitation sending logic
      res.json({ success: true, invitationId });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats/:userId", async (req, res) => {
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

  // Settings endpoints
  app.get("/api/settings/:userId", async (req, res) => {
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

  app.post("/api/settings/:userId", async (req, res) => {
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
        timestamp: new Date()
      });
      const updatedUser = await storage.getUser(userId);
      const updatedSettings = updatedUser?.settings ? JSON.parse(updatedUser.settings) : {};
      res.json({ success: true, message: "Settings saved successfully", settings: updatedSettings });
    } catch (error) {
      console.error("Save settings error:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // Activity logs endpoint
  app.get("/api/activity/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { limit = 50 } = req.query;
      const logs = await storage.getActivityLogs(userId, parseInt(limit as string));
      res.json(logs);
    } catch (error) {
      console.error("Get activity logs error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // AI models endpoint
  app.get("/api/ai/models", async (req, res) => {
    try {
      const models = aiModelManager.getAvailableModels();
      res.json(models);
    } catch (error) {
      console.error("Error getting AI models:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // TikTok webhook endpoints
  app.post("/api/webhooks/tiktok", async (req, res) => {
    try {
      const { TikTokWebhookHandler } = await import("./webhooks/tiktok-webhooks");
      const webhookHandler = new TikTokWebhookHandler();
      await webhookHandler.handleWebhook(req, res);
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/webhooks/tiktok/verify", async (req, res) => {
    try {
      const { TikTokWebhookHandler } = await import("./webhooks/tiktok-webhooks");
      const webhookHandler = new TikTokWebhookHandler();
      await webhookHandler.handleWebhookVerification(req, res);
    } catch (error) {
      console.error("Webhook verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Session refresh endpoint
  app.post("/api/session/refresh", async (req, res) => {
    try {
      // TODO: Implement session refresh logic
      res.json({ success: true, message: "Session refreshed" });
    } catch (error) {
      console.error("Refresh session error:", error);
      res.status(500).json({ error: "Failed to refresh session" });
    }
  });

  // TikTok automation status
  app.get("/api/automation/status", (req, res) => {
    res.json({
      initialized: false,
      message: "Automation service not configured"
    });
  });
}
