import { Express } from "express";

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

  // Creators endpoint
  app.get("/api/creators", (req, res) => {
    res.json([]);
  });

  // Campaigns endpoint
  app.get("/api/campaigns", (req, res) => {
    res.json([]);
  });

  // TikTok automation status
  app.get("/api/automation/status", (req, res) => {
    res.json({
      initialized: false,
      message: "Automation service not configured"
    });
  });
}