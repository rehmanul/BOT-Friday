
import { TikTokAPI, TikTokUser, TikTokVideo } from '../api/tiktok-api';
import { storage } from '../storage';

export interface TikTokAuthResult {
  success: boolean;
  user?: TikTokUser;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export class TikTokService {
  private api: TikTokAPI;

  constructor() {
    this.api = new TikTokAPI({
      appId: process.env.TIKTOK_APP_ID!,
      appSecret: process.env.TIKTOK_APP_SECRET!
    });
  }

  // Generate auth URL for user login
  generateAuthURL(userId: number): string {
    const redirectUri = process.env.TIKTOK_REDIRECT_URI!;
    const state = `user_${userId}_${Date.now()}`;
    return this.api.generateAuthURL(redirectUri, state);
  }

  // Handle OAuth callback
  async handleAuthCallback(code: string, state: string): Promise<TikTokAuthResult> {
    try {
      const redirectUri = process.env.TIKTOK_REDIRECT_URI!;
      
      // Get access token
      const tokenData = await this.api.getAccessToken(code, redirectUri);
      
      // Get user info
      const userInfo = await this.api.getUserInfo(tokenData.access_token);
      
      // Extract user ID from state
      const userId = parseInt(state.split('_')[1]);
      
      // Store tokens in database
      if (tokenData.access_token) {
        await storage.storeTikTokTokens(userId, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          refreshExpiresAt: new Date(Date.now() + tokenData.refresh_expires_in * 1000)
        });
      }

      return {
        success: true,
        user: userInfo,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      };
    } catch (error) {
      console.error('TikTok auth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  // Get user's TikTok profile
  async getUserProfile(userId: number): Promise<TikTokUser | null> {
    try {
      const tokens = await storage.getTikTokTokens(userId);
      if (!tokens || !tokens.accessToken) {
        return null;
      }

      // Check if token needs refresh
      if (tokens.expiresAt && tokens.expiresAt < new Date()) {
        const refreshed = await this.refreshUserToken(userId);
        if (!refreshed) return null;
        // Get fresh tokens
        const newTokens = await storage.getTikTokTokens(userId);
        if (!newTokens) return null;
        tokens.accessToken = newTokens.accessToken;
      }

      return await this.api.getUserInfo(tokens.accessToken);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Search for creators
  async searchCreators(userId: number, query: string, filters?: {
    follower_min?: number;
    follower_max?: number;
    engagement_rate_min?: number;
    country?: string;
  }): Promise<TikTokUser[]> {
    try {
      const tokens = await storage.getTikTokTokens(userId);
      if (!tokens || !tokens.accessToken) {
        throw new Error('No TikTok access token available');
      }

      // Check if token needs refresh
      if (tokens.expiresAt && tokens.expiresAt < new Date()) {
        const refreshed = await this.refreshUserToken(userId);
        if (!refreshed) throw new Error('Failed to refresh token');
        const newTokens = await storage.getTikTokTokens(userId);
        if (!newTokens) throw new Error('No tokens after refresh');
        tokens.accessToken = newTokens.accessToken;
      }

      return await this.api.searchCreators(query, tokens.accessToken, filters);
    } catch (error) {
      console.error('Failed to search creators:', error);
      return [];
    }
  }

  // Send message to creator
  async sendMessage(userId: number, recipientId: string, message: string): Promise<boolean> {
    try {
      const tokens = await storage.getTikTokTokens(userId);
      if (!tokens || !tokens.accessToken) {
        return false;
      }

      // Check if token needs refresh
      if (tokens.expiresAt && tokens.expiresAt < new Date()) {
        const refreshed = await this.refreshUserToken(userId);
        if (!refreshed) return false;
        const newTokens = await storage.getTikTokTokens(userId);
        if (!newTokens) return false;
        tokens.accessToken = newTokens.accessToken;
      }

      return await this.api.sendMessage(recipientId, message, tokens.accessToken);
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  // Refresh user's access token
  private async refreshUserToken(userId: number): Promise<boolean> {
    try {
      const tokens = await storage.getTikTokTokens(userId);
      if (!tokens || !tokens.refreshToken) {
        return false;
      }

      const refreshedTokens = await this.api.refreshAccessToken(tokens.refreshToken);
      
      await storage.storeTikTokTokens(userId, {
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token,
        expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000),
        refreshExpiresAt: new Date(Date.now() + refreshedTokens.refresh_expires_in * 1000)
      });

      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  // Get user videos
  async getUserVideos(userId: number, cursor?: string): Promise<{
    videos: TikTokVideo[];
    cursor: string;
    has_more: boolean;
  } | null> {
    try {
      const tokens = await storage.getTikTokTokens(userId);
      if (!tokens || !tokens.accessToken) {
        return null;
      }

      // Check if token needs refresh
      if (tokens.expiresAt && tokens.expiresAt < new Date()) {
        const refreshed = await this.refreshUserToken(userId);
        if (!refreshed) return null;
        const newTokens = await storage.getTikTokTokens(userId);
        if (!newTokens) return null;
        tokens.accessToken = newTokens.accessToken;
      }

      return await this.api.getUserVideos(tokens.accessToken, cursor);
    } catch (error) {
      console.error('Failed to get user videos:', error);
      return null;
    }
  }
}

export const tiktokService = new TikTokService();
