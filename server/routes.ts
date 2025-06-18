
import { Express } from "express";
import { storage } from "./storage";
import { insertCampaignSchema, insertCampaignInvitationSchema } from "../shared/schema";
import { aiModelManager } from "./ai/ai-model-manager";
import { aiService } from "./automation/ai-service";
import { generateAnalyticsOverview } from "./storage";
import { asyncHandler, AppError } from "./middleware/error-handler";
import { authenticateUser, AuthenticatedRequest } from "./middleware/auth";
import { validateBody, validateParams, validateQuery } from "./middleware/validation";
import { rateLimiter } from "./automation/rate-limiter";
import { automationTester } from "./utils/test-helpers";
import { logger } from "./utils/logger";
import { z } from "zod";
import { tiktokService } from "./services/tiktok-service";

let broadcastFunction: ((userId: number, message: any) => void) | null = null;

export function setBroadcastFunction(fn: (userId: number, message: any) => void) {
  broadcastFunction = fn;
}

// Validation schemas
const userIdParamSchema = z.object({
  userId: z.string().regex(/^\d+$/).transform(Number)
});

const campaignIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100)
});

const creatorDiscoverySchema = z.object({
  criteria: z.string().min(1).max(500),
  count: z.number().min(1).max(50).optional().default(10)
});

const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export async function registerRoutes(app: Express) {
  // Testing endpoint (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/test/automation", asyncHandler(async (req, res) => {
      logger.info('Running automation tests', 'test');
      const results = await automationTester.runAllTests();
      res.json({ results });
    }));
  }

  // Rate limiter status endpoint
  app.get("/api/rate-limiter/metrics", asyncHandler(async (req, res) => {
    const metrics = rateLimiter.getMetrics();
    res.json(metrics);
  }));

  // Session profile endpoint
  app.get("/api/session/profile", asyncHandler(async (req, res) => {
    // Return mock profile data for now
    res.json({
      profile: {
        username: "user",
        displayName: "User",
        avatar: "https://via.placeholder.com/40"
      }
    });
  }));

  // Session endpoint with userId
  app.get("/api/session/:userId", 
    validateParams(userIdParamSchema),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { userId } = req.params;
      logger.debug(`Fetching session for user ${userId}`, 'session', userId);
      
      const user = await storage.getUser(userId);
      if (!user) {
        throw new AppError("User not found", 404, 'session');
      }
      res.json({ user });
    })
  );

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
  app.get("/api/creators/search", 
    validateQuery(searchQuerySchema),
    asyncHandler(async (req, res) => {
      const { q } = req.query;
      logger.debug(`Searching creators with query: ${q}`, 'creators');
      
      const creators = await storage.searchCreators(q as string);
      res.json(creators);
    })
  );

  // Creator discovery endpoint
  app.post("/api/creators/discover", 
    validateBody(creatorDiscoverySchema),
    asyncHandler(async (req, res) => {
      const { criteria, count } = req.body;
      logger.info(`Discovering creators with criteria: ${criteria}`, 'creator-discovery');
      
      const discoveredCreators = await aiService.discoverCreators(criteria, count);
      const savedCreators = [];
      
      for (const creatorData of discoveredCreators) {
        try {
          const existing = await storage.getCreatorByUsername(creatorData.username);
          if (!existing) {
            const creator = await storage.createCreator(creatorData);
            savedCreators.push(creator);
            logger.debug(`Saved new creator: ${creator.username}`, 'creator-discovery');
          }
        } catch (error) {
          logger.warn(`Error saving discovered creator: ${creatorData.username}`, 'creator-discovery', undefined, error);
        }
      }
      
      res.json(savedCreators);
    })
  );

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

  // Send invitation endpoint (for direct campaign invitations)
  app.post("/api/campaigns/send-invitation", async (req, res) => {
    try {
      const { creatorId, message } = req.body;
      
      if (!creatorId || !message) {
        return res.status(400).json({ error: "Creator ID and message are required" });
      }

      const creator = await storage.getCreator(parseInt(creatorId));
      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }

      // Check if TikTok is authenticated
      const isAuthenticated = await tiktokService.isAuthenticated();
      if (!isAuthenticated) {
        return res.status(401).json({ 
          error: "TikTok authentication required", 
          requiresAuth: true 
        });
      }

      // Create invitation record
      const invitation = await storage.createCampaignInvitation({
        campaignId: 1, // Default campaign for now
        creatorId: parseInt(creatorId),
        message,
        status: "pending",
        sentAt: null
      });

      // Actually send the invitation via TikTok API
      const sendResult = await tiktokService.sendMessage(1, creator.username, message);
      
      if (sendResult) {
        await storage.updateCampaignInvitation(invitation.id, {
          status: "sent",
          sentAt: new Date()
        });

        // Log successful send
        await storage.createActivityLog({
          userId: 1,
          campaignId: 1,
          type: "invitation_sent",
          message: `Invitation sent to @${creator.username}`,
          timestamp: new Date()
        });

        res.json({ success: true, invitationId: invitation.id });
      } else {
        await storage.updateCampaignInvitation(invitation.id, {
          status: "failed",
          sentAt: new Date()
        });

        res.status(500).json({ error: "Failed to send invitation via TikTok API" });
      }
    } catch (error) {
      console.error("Send invitation error:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });

  // Send invitation endpoint (for existing invitations)
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

  // TikTok OAuth routes
  app.get("/api/auth/tiktok/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const authUrl = tiktokService.getAuthorizationURL(userId);
      res.redirect(authUrl);
    } catch (error) {
      console.error("TikTok auth redirect error:", error);
      res.status(500).json({ error: "Failed to redirect to TikTok auth" });
    }
  });

  app.get("/api/auth/tiktok/callback", async (req, res) => {
    try {
      const { code, state } = req.query as { code: string; state: string };
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code missing" });
      }

      const result = await tiktokService.handleAuthCallback(code, state);
      
      if (result.success) {
        res.redirect("/?auth=success");
      } else {
        res.redirect(`/?auth=error&message=${encodeURIComponent(result.error || "Authentication failed")}`);
      }
    } catch (error) {
      console.error("TikTok auth callback error:", error);
      res.redirect("/?auth=error&message=Authentication%20failed");
    }
  });

  app.get("/api/auth/tiktok/status", async (req, res) => {
    try {
      const isAuthenticated = await tiktokService.isAuthenticated();
      const accountInfo = isAuthenticated ? await tiktokService.getAccountInfo() : null;
      
      res.json({
        isAuthenticated,
        profile: accountInfo ? {
          username: accountInfo.username || "TikTok User",
          displayName: accountInfo.display_name || "TikTok User",
          avatar: accountInfo.avatar_url || "https://via.placeholder.com/40",
          verified: accountInfo.verified || false,
          followers: accountInfo.follower_count || 0
        } : null
      });
    } catch (error) {
      console.error("TikTok auth status error:", error);
      res.json({ isAuthenticated: false, profile: null });
    }
  });

  app.post("/api/auth/tiktok/disconnect", async (req, res) => {
    try {
      await tiktokService.clearAuth();
      res.json({ success: true, message: "TikTok account disconnected" });
    } catch (error) {
      console.error("TikTok disconnect error:", error);
      res.status(500).json({ error: "Failed to disconnect TikTok account" });
    }
  });

  // TikTok automation status
  app.get("/api/automation/status", async (req, res) => {
    try {
      const isAuthenticated = await tiktokService.isAuthenticated();
      res.json({
        initialized: isAuthenticated,
        message: isAuthenticated ? "TikTok API connected and ready" : "TikTok authentication required"
      });
    } catch (error) {
      console.error("Automation status error:", error);
      res.json({
        initialized: false,
        message: "Automation service not configured"
      });
    }
  });
}
