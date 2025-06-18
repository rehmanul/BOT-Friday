
import crypto from 'crypto';
import fetch from 'node-fetch';

export interface TikTokAPIConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface TikTokUser {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export interface TikTokVideo {
  id: string;
  title: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  embed_html: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export class TikTokAPI {
  private config: TikTokAPIConfig;
  private baseURL = 'https://open.tiktokapis.com/v2';
  private businessURL = 'https://business-api.tiktok.com/open_api/v1.3';

  constructor(config: TikTokAPIConfig) {
    this.config = config;
  }

  // Generate OAuth URL for user authorization
  generateAuthURL(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_key: this.config.appId,
      scope: 'user.info.basic,video.list,video.upload',
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state || crypto.randomBytes(16).toString('hex')
    });

    return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
    scope: string;
    token_type: string;
  }> {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: this.config.appId,
        client_secret: this.config.appSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<TikTokUser> {
    const response = await fetch(`${this.baseURL}/user/info/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: [
          'open_id',
          'union_id',
          'avatar_url',
          'avatar_url_100',
          'avatar_large_url',
          'display_name',
          'bio_description',
          'profile_deep_link',
          'is_verified',
          'follower_count',
          'following_count',
          'likes_count',
          'video_count'
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.user;
  }

  // Get user videos
  async getUserVideos(accessToken: string, cursor?: string, maxCount: number = 20): Promise<{
    videos: TikTokVideo[];
    cursor: string;
    has_more: boolean;
  }> {
    const body: any = {
      max_count: maxCount,
      fields: [
        'id',
        'title',
        'video_description',
        'duration',
        'height',
        'width',
        'embed_html',
        'embed_link',
        'like_count',
        'comment_count',
        'share_count',
        'view_count'
      ]
    };

    if (cursor) {
      body.cursor = cursor;
    }

    const response = await fetch(`${this.baseURL}/video/list/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to get user videos: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      videos: data.data.videos,
      cursor: data.data.cursor,
      has_more: data.data.has_more
    };
  }

  // Send direct message (requires Business API access)
  async sendMessage(recipientId: string, message: string, accessToken: string): Promise<boolean> {
    try {
      // Note: This is a placeholder - TikTok's messaging API has specific requirements
      // and may require additional permissions and setup
      const response = await fetch(`${this.businessURL}/message/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          message_type: 'text',
          content: {
            text: message
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  // Search creators (Business API)
  async searchCreators(query: string, accessToken: string, filters?: {
    follower_min?: number;
    follower_max?: number;
    engagement_rate_min?: number;
    country?: string;
  }): Promise<TikTokUser[]> {
    try {
      const body: any = {
        query,
        limit: 50
      };

      if (filters) {
        Object.assign(body, filters);
      }

      const response = await fetch(`${this.businessURL}/creator/search/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to search creators: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.creators || [];
    } catch (error) {
      console.error('Failed to search creators:', error);
      return [];
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
  }> {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: this.config.appId,
        client_secret: this.config.appSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return await response.json();
  }
}
