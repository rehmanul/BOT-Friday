import type { Express } from "express";
import { createServer, type Server } from "http";

import { storage } from "./storage";
import { PuppeteerAutomation } from "./automation/puppeteer";
import { AIService } from "./automation/ai-service";
import { RateLimiter } from "./automation/rate-limiter";
import { insertCampaignSchema, insertCreatorSchema, insertCampaignInvitationSchema } from "@shared/schema";
import { z } from "zod";
import { Request, Response } from 'express';
import { AIModelManager } from './ai/ai-model-manager';

const aiModelManager = new AIModelManager();



function getApiKeyName(modelId: string): string {
  const modelMapping: Record<string, string> = {
    'anthropic-claude-sonnet-4': 'ANTHROPIC_API_KEY',
    'openai-gpt-4o': 'OPENAI_API_KEY',
    'perplexity-sonar': 'PERPLEXITY_API_KEY',
    'gemini-pro': 'GEMINI_API_KEY'
  };
  return modelMapping[modelId] || '';
}

async function checkTikTokSession() {
  // Mock session data for now - in production this would check actual browser session
  const mockSessionData = {
    isLoggedIn: true,
    profile: {
      username: 'digi4u_repair',
      displayName: 'Digi4u Repair UK',
      avatar: 'https://via.placeholder.com/40',
      verified: true,
      followers: 15420,
      isActive: true
    }
  };

  return mockSessionData;
}

async function generateAnalyticsOverview() {
  const campaigns = await storage.getCampaigns(1);
  const creators = await storage.getCreators(1, 50, {});

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalCreators: creators.length,
    totalInvitations: 245,
    responseRate: 32.5,
    avgEngagementRate: 4.2,
    totalReach: 2500000,
    conversionRate: 12.3
  };
}

async function discoverCreators(criteria: {
  searchTerms?: string;
  category?: string;
  minFollowers?: number;
  maxFollowers?: number;
}) {
  // Mock creator discovery with diverse, realistic data
  const mockCreators = [
    {
      username: 'techreviewer123',
      fullName: 'Tech Reviewer 123',
      followers: 125000,
      engagementRate: 4.5,
      category: 'Technology',
      avgGMV: 2500,
      profilePicture: 'https://via.placeholder.com/40',
      isVerified: false,
      bio: 'Tech enthusiast and phone repair tips'
    },
    {
      username: 'phoneexpert',
      fullName: 'Phone Expert',
      followers: 89000,
      engagementRate: 6.2,
      category: 'Technology',
      avgGMV: 1800,
      profilePicture: 'https://via.placeholder.com/40',
      isVerified: true,
      bio: 'Mobile phone tips and tricks'
    },
    {
      username: 'mobilemechanic',
      fullName: 'Mobile Mechanic',
      followers: 67000,
      engagementRate: 5.8,
      category: 'Technology',
      avgGMV: 1200,
      profilePicture: 'https://via.placeholder.com/40',
      isVerified: false,
      bio: 'Fixing phones one video at a time'
    },
    {
      username: 'gadgetguru',
      fullName: 'Gadget Guru',
      followers: 156000,
      engagementRate: 3.9,
      category: 'Technology',
      avgGMV: 3200,
      profilePicture: 'https://via.placeholder.com/40',
      isVerified: true,
      bio: 'Latest tech reviews and unboxings'
    },
    {
      username: 'repairpro',
      fullName: 'Repair Pro',
      followers: 43000,
      engagementRate: 7.2,
      category: 'Technology',
      avgGMV: 950,
      profilePicture: 'https://via.placeholder.com/40',
      isVerified: false,
      bio: 'Professional repair tutorials'
    }
  ];

  return mockCreators.filter(creator => {
    if (criteria.category && creator.category !== criteria.category) return false;
    if (criteria.minFollowers && creator.followers < criteria.minFollowers) return false;
    if (criteria.maxFollowers && creator.followers > criteria.maxFollowers) return false;
    if (criteria.searchTerms) {
      const searchLower = criteria.searchTerms.toLowerCase();
      return creator.username.toLowerCase().includes(searchLower) ||
             creator.fullName.toLowerCase().includes(searchLower) ||
             creator.bio.toLowerCase().includes(searchLower);
    }
    return true;
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize services
  const puppeteerService = new PuppeteerAutomation();
  const aiService = new AIService();
  const rateLimiter = new RateLimiter();

  

  // Helper function to broadcast to user (using Socket.IO from index.ts)
  function broadcastToUser(userId: number, data: any) {
    // This function is now handled by Socket.IO in server/index.ts
    console.log(`Broadcasting to user ${userId}:`, data);
  }

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Campaigns endpoints
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

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData);

      // Log activity
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_created",
        message: `Campaign "${campaign.name}" created`,
        timestamp: new Date()
      });

      broadcastToUser(campaign.userId, {
        type: 'campaign_created',
        campaign
      });

      res.json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const campaign = await storage.updateCampaign(id, updates);

      // Log activity
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_updated",
        message: `Campaign "${campaign.name}" updated`,
        timestamp: new Date()
      });

      broadcastToUser(campaign.userId, {
        type: 'campaign_updated',
        campaign
      });

      res.json(campaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Start campaign automation
  app.post("/api/campaigns/:id/start", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Update campaign status to active
      const updatedCampaign = await storage.updateCampaign(campaignId, { status: "active" });

      // Log activity
      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_started",
        message: `Campaign "${campaign.name}" started`,
        timestamp: new Date()
      });

      broadcastToUser(campaign.userId, {
        type: 'campaign_started',
        campaign: updatedCampaign
      });

      // Start automation in background
      startCampaignAutomation(campaignId, campaign.userId);

      res.json({ success: true, campaign: updatedCampaign });
    } catch (error) {
      console.error("Start campaign error:", error);
      res.status(500).json({ error: "Failed to start campaign" });
    }
  });

  // Pause/Stop campaign
  app.post("/api/campaigns/:id/pause", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.updateCampaign(campaignId, { status: "paused" });

      await storage.createActivityLog({
        userId: campaign.userId,
        campaignId: campaign.id,
        type: "campaign_paused",
        message: `Campaign "${campaign.name}" paused`,
        timestamp: new Date()
      });

      broadcastToUser(campaign.userId, {
        type: 'campaign_paused',
        campaign
      });

      res.json(campaign);
    } catch (error) {
      console.error("Pause campaign error:", error);
      res.status(500).json({ error: "Failed to pause campaign" });
    }
  });

  // Creators endpoints
  app.get("/api/creators", async (req, res) => {
    try {
      const { category, minFollowers, maxFollowers, minGMV, maxGMV, limit = 25, offset = 0 } = req.query;

      const filters: any = {};
      if (category) filters.category = category;
      if (minFollowers) filters.minFollowers = parseInt(minFollowers as string);
      if (maxFollowers) filters.maxFollowers = parseInt(maxFollowers as string);
      if (minGMV) filters.minGMV = parseFloat(minGMV as string);
      if (maxGMV) filters.maxGMV = parseFloat(maxGMV as string);

      const creators = await storage.getCreators(filters, parseInt(limit as string), parseInt(offset as string));
      res.json(creators);
    } catch (error) {
      console.error("Get creators error:", error);
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });

  app.post("/api/creators", async (req, res) => {
    try {
      const creatorData = insertCreatorSchema.parse(req.body);
      const creator = await storage.createCreator(creatorData);
      res.json(creator);
    } catch (error) {
      console.error("Create creator error:", error);
      res.status(500).json({ error: "Failed to create creator" });
    }
  });

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

  // Browser session endpoints
  app.get("/api/session/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const session = await storage.getActiveBrowserSession(userId);
      res.json(session || { isActive: false });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/session/:userId/refresh", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Deactivate existing sessions
      await storage.deactivateBrowserSessions(userId);

      // Create mock session data for now
      const sessionData = {
        cookies: [],
        localStorage: {},
        isActive: true
      };

      const session = await storage.createBrowserSession({
        userId,
        sessionData: JSON.stringify(sessionData),
        isActive: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      await storage.createActivityLog({
        userId,
        type: "session_refresh",
        message: "TikTok session refreshed",
        timestamp: new Date()
      });

      broadcastToUser(userId, {
        type: 'session_refreshed',
        session
      });

      res.json(session);
    } catch (error) {
      console.error("Refresh session error:", error);
      res.status(500).json({ error: "Failed to refresh session" });
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

  // Campaign statistics endpoint
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

  // AI-powered creator discovery
  app.post("/api/creators/discover", async (req, res) => {
    try {
      const { criteria, count = 10 } = req.body;

      // Use AI service to discover creators
      const discoveredCreators = await aiService.discoverCreators(criteria, count);

      // Save discovered creators to database
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

  // Campaign automation function
  async function startCampaignAutomation(campaignId: number, userId: number) {
    try {
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.status !== "active") return;

      const pendingInvitations = await storage.getPendingInvitations(campaignId);

      for (const invitation of pendingInvitations) {
        try {
          // Check rate limits
          if (!rateLimiter.canSendInvitation(userId)) {
            await storage.createActivityLog({
              userId,
              campaignId,
              type: "rate_limit_reached",
              message: "Rate limit reached, pausing automation",
              timestamp: new Date()
            });
            break;
          }

          // Get creator details
          const creator = await storage.getCreator(invitation.creatorId);
          if (!creator) continue;

          // Send invitation using Puppeteer
          const result = await puppeteerService.sendInvitation(creator.username, invitation.invitationText || campaign.invitationTemplate);

          if (result.success) {
            await storage.updateCampaignInvitation(invitation.id, {
              status: "sent",
              sentAt: new Date()
            });

            // Update campaign sent count
            await storage.updateCampaign(campaignId, {
              sentCount: (campaign.sentCount || 0) + 1
            });

            await storage.createActivityLog({
              userId,
              campaignId,
              type: "invitation_sent",
              message: `Invitation sent to @${creator.username}`,
              metadata: { creatorId: creator.id },
              timestamp: new Date()
            });

            broadcastToUser(userId, {
              type: 'invitation_sent',
              creator,
              campaign: campaignId
            });

            // Record rate limit usage
            rateLimiter.recordInvitation(userId);

          } else {
            await storage.updateCampaignInvitation(invitation.id, {
              status: "failed",
              errorMessage: result.error,
              retryCount: (invitation.retryCount || 0) + 1
            });

            await storage.createActivityLog({
              userId,
              campaignId,
              type: "invitation_failed",
              message: `Failed to send invitation to @${creator.username}: ${result.error}`,
              metadata: { creatorId: creator.id, error: result.error },
              timestamp: new Date()
            });
          }

          // Human-like delay between invitations
          if (campaign.humanLikeDelays) {
            const delay = Math.random() * (10 - 2) + 2; // 2-10 minutes
            await new Promise(resolve => setTimeout(resolve, delay * 60 * 1000));
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

      // Check if campaign is complete
      const remainingInvitations = await storage.getPendingInvitations(campaignId);
      if (remainingInvitations.length === 0 || (campaign.sentCount || 0) >= campaign.targetInvitations) {
        await storage.updateCampaign(campaignId, { status: "completed" });

        await storage.createActivityLog({
          userId,
          campaignId,
          type: "campaign_completed",
          message: `Campaign "${campaign.name}" completed`,
          timestamp: new Date()
        });

        broadcastToUser(userId, {
          type: 'campaign_completed',
          campaign: campaignId
        });
      }

    } catch (error) {
      console.error("Campaign automation error:", error);
    }
  }

  // AI Model Management Routes
  app.get('/api/ai/models/status', async (req: Request, res: Response) => {
    try {
      const models = aiModelManager.getAvailableModels();
      const modelStatus: Record<string, boolean> = {};

      models.forEach(model => {
        modelStatus[model.id] = model.isConfigured;
      });

      res.json(modelStatus);
    } catch (error) {
      console.error('Error getting model status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/ai/models/configure', async (req: Request, res: Response) => {
    try {
      const { modelId, apiKey } = req.body;

      if (!modelId || !apiKey) {
        return res.status(400).json({ error: 'Model ID and API key are required' });
      }

      // Store API key securely (in production, use proper secret management)
      process.env[getApiKeyName(modelId)] = apiKey;

      res.json({ success: true, message: 'Model configured successfully' });
    } catch (error) {
      console.error('Error configuring model:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Session Management Routes
  app.get('/api/session/profile', async (req: Request, res: Response) => {
    try {
      res.json({
        isLoggedIn: true,
        profile: {
          username: 'digi4u_repair',
          displayName: 'Digi4u Repair UK',
          avatar: 'https://via.placeholder.com/40',
          verified: true,
          followers: 15420,
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error fetching session profile:', error);
      res.status(500).json({ 
        isLoggedIn: false, 
        profile: null,
        error: 'Failed to fetch session'
      });
    }
  });

  // Send invitation to creator
  app.post('/api/campaigns/send-invitation', async (req: Request, res: Response) => {
    try {
      const { creatorId, message } = req.body;

      if (!creatorId || !message) {
        return res.status(400).json({ error: 'Creator ID and message are required' });
      }

      // Create invitation record
      const invitation = await storage.createCampaignInvitation({
        campaignId: 1, // Default campaign for now
        creatorId: parseInt(creatorId),
        message,
        status: 'sent',
        sentAt: new Date()
      });

      res.json({ success: true, invitationId: invitation.id });
    } catch (error) {
      console.error('Error sending invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Webhook Routes
  app.post('/api/webhooks/tiktok', async (req: Request, res: Response) => {
    try {
      const { TikTokWebhookHandler } = await import('./webhooks/tiktok-webhooks');
      const webhookHandler = new TikTokWebhookHandler();
      await webhookHandler.handleWebhook(req, res);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.get('/api/webhooks/tiktok/verify', async (req: Request, res: Response) => {
    try {
      const { TikTokWebhookHandler } = await import('./webhooks/tiktok-webhooks');
      const webhookHandler = new TikTokWebhookHandler();
      await webhookHandler.handleWebhookVerification(req, res);
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  // Settings endpoints
  app.get('/api/settings/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const settings = user.settings || {};
      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = req.body;

      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await storage.updateUserSettings(userId, settings);

      await storage.createActivityLog({
        userId,
        type: "settings_updated",
        message: "User settings updated",
        timestamp: new Date()
      });

      res.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Save settings error:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // Analytics endpoints
  app.get('/api/analytics/overview', async (req: Request, res: Response) => {
    try {
      const overview = await generateAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  

  return httpServer;
}