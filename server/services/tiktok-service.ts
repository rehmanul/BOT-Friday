
import { tiktokAPI } from '../api/tiktok-api';
import { storage } from '../storage';

export class TikTokService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadStoredTokens();
  }

  // Load stored tokens from persistent storage
  private async loadStoredTokens(): Promise<void> {
    try {
      const tokenData = await storage.get('tiktok_tokens');
      if (tokenData) {
        this.accessToken = tokenData.access_token;
        this.refreshToken = tokenData.refresh_token;
        this.tokenExpiry = tokenData.expires_at;
        
        if (this.accessToken) {
          tiktokAPI.setAccessToken(this.accessToken);
        }
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
    }
  }

  // Store tokens persistently
  private async storeTokens(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    try {
      const expiresAt = Date.now() + (expiresIn * 1000);
      const tokenData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt
      };

      await storage.set('tiktok_tokens', tokenData);
      
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = expiresAt;
      
      tiktokAPI.setAccessToken(accessToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  // Get authorization URL for user to authenticate
  getAuthorizationURL(userId: number): string {
    const state = `user_${userId}_${Date.now()}`;
    return tiktokAPI.getAuthorizationURL(state);
  }

  // Handle OAuth callback and exchange code for tokens
  async handleAuthCallback(authCode: string, state: string): Promise<{ success: boolean; error?: string }> {
    try {
      const tokenResponse = await tiktokAPI.exchangeCodeForToken(authCode);
      
      // Store tokens persistently
      await this.storeTokens(
        tokenResponse.access_token,
        '', // TikTok may not provide refresh token in some flows
        tokenResponse.expires_in
      );

      console.log('TikTok authentication successful');
      return { success: true };
    } catch (error) {
      console.error('TikTok auth callback failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    // Check if token is expired
    if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
      // Try to refresh token
      if (this.refreshToken) {
        try {
          const refreshResponse = await tiktokAPI.refreshAccessToken(this.refreshToken);
          await this.storeTokens(refreshResponse.access_token, this.refreshToken, refreshResponse.expires_in);
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return false;
        }
      }
      return false;
    }

    // Validate token with TikTok API
    return await tiktokAPI.validateToken();
  }

  // Send message to creator
  async sendMessage(userId: number, creatorUsername: string, message: string): Promise<boolean> {
    try {
      if (!await this.isAuthenticated()) {
        console.error('Not authenticated with TikTok API');
        return false;
      }

      // For now, we'll simulate sending via the API
      // In production, you'd need to get the creator ID first, then send message
      const success = await tiktokAPI.sendCreatorMessage(creatorUsername, message);
      
      if (success) {
        console.log(`Message sent to creator ${creatorUsername}`);
        
        // Store the activity in our database
        await storage.set(`message_${userId}_${creatorUsername}_${Date.now()}`, {
          userId,
          creatorUsername,
          message,
          timestamp: new Date(),
          status: 'sent'
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to send message via TikTok API:', error);
      return false;
    }
  }

  // Get account information
  async getAccountInfo(): Promise<any> {
    try {
      if (!await this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      return await tiktokAPI.getAccountInfo();
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }

  // Search for creators
  async searchCreators(filters: {
    category?: string;
    minFollowers?: number;
    maxFollowers?: number;
    location?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any[]> {
    try {
      if (!await this.isAuthenticated()) {
        console.error('Not authenticated with TikTok API');
        return [];
      }

      const response = await tiktokAPI.searchCreators(filters);
      return response.data?.creators || [];
    } catch (error) {
      console.error('Failed to search creators:', error);
      return [];
    }
  }

  // Get creator insights
  async getCreatorInsights(creatorId: string): Promise<any> {
    try {
      if (!await this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      return await tiktokAPI.getCreatorInsights(creatorId);
    } catch (error) {
      console.error('Failed to get creator insights:', error);
      throw error;
    }
  }

  // Get campaigns
  async getCampaigns(advertiserId: string): Promise<any[]> {
    try {
      if (!await this.isAuthenticated()) {
        console.error('Not authenticated with TikTok API');
        return [];
      }

      const response = await tiktokAPI.getCampaigns(advertiserId);
      return response.data?.campaigns || [];
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      return [];
    }
  }

  // Create campaign
  async createCampaign(advertiserId: string, campaignData: any): Promise<any> {
    try {
      if (!await this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      return await tiktokAPI.createCampaign(advertiserId, campaignData);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  // Get stored messages/activities
  async getStoredActivities(userId: number): Promise<any[]> {
    try {
      const activities = [];
      const keys = await storage.getKeys();
      
      for (const key of keys) {
        if (key.startsWith(`message_${userId}_`)) {
          const activity = await storage.get(key);
          if (activity) {
            activities.push(activity);
          }
        }
      }

      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Failed to get stored activities:', error);
      return [];
    }
  }

  // Clear authentication
  async clearAuth(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    try {
      await storage.delete('tiktok_tokens');
    } catch (error) {
      console.error('Failed to clear stored tokens:', error);
    }
  }
}

export const tiktokService = new TikTokService();
