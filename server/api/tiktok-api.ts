import fetch from 'node-fetch';

const TIKTOK_APP_ID = process.env.TIKTOK_APP_ID || '7512649815700963329';
const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || 'e448a875d92832486230db13be28db0444035303';
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://affiliate.tiktok.com/connection/creator?shop_region=GB&is_new_user=0&is_new_connect=0';

export class TikTokAPI {
  private baseURL = 'https://business-api.tiktok.com/open_api/v1.3';
  private authURL = 'https://business-api.tiktok.com/portal/auth';
  private accessToken: string | null = null;

  // Generate authorization URL for TikTok Business API
  getAuthorizationURL(state?: string): string {
    const params = new URLSearchParams({
      app_id: TIKTOK_APP_ID,
      redirect_uri: TIKTOK_REDIRECT_URI,
      state: state || 'auth_state'
    });

    return `${this.authURL}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(authCode: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: TIKTOK_APP_ID,
          secret: TIKTOK_APP_SECRET,
          auth_code: authCode,
          grant_type: 'authorization_code'
        })
      });

      const data = await response.json() as any;

      if (data.code === 0) {
        this.accessToken = data.data.access_token;
        return {
          access_token: data.data.access_token,
          expires_in: data.data.access_token_expire_time
        };
      } else {
        throw new Error(`TikTok API Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  // Set access token for API calls
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // Get advertiser info
  async getAdvertiserInfo(): Promise<any> {
    return this.makeAPICall('/advertiser/info/');
  }

  // Get account balance
  async getAccountBalance(advertiserId: string): Promise<any> {
    return this.makeAPICall('/advertiser/balance/get/', {
      advertiser_id: advertiserId
    });
  }

  // Create a campaign
  async createCampaign(advertiserId: string, campaignData: any): Promise<any> {
    return this.makeAPICall('/campaign/create/', {
      advertiser_id: advertiserId,
      ...campaignData
    });
  }

  // Get campaigns
  async getCampaigns(advertiserId: string, page: number = 1, pageSize: number = 10): Promise<any> {
    return this.makeAPICall('/campaign/get/', {
      advertiser_id: advertiserId,
      page,
      page_size: pageSize
    });
  }

  // Send message to creator (via TikTok Creator Marketplace API)
  async sendCreatorMessage(creatorId: string, message: string): Promise<boolean> {
    try {
      // Note: This is a placeholder for the actual TikTok Creator Marketplace API
      // The exact endpoint may vary based on TikTok's current API structure
      const response = await this.makeAPICall('/tcm/message/send/', {
        creator_id: creatorId,
        message: message,
        message_type: 'invitation'
      });

      return response.code === 0;
    } catch (error) {
      console.error('Failed to send creator message:', error);
      return false;
    }
  }

  // Get creator insights
  async getCreatorInsights(creatorId: string): Promise<any> {
    return this.makeAPICall('/tcm/creator/insights/', {
      creator_id: creatorId
    });
  }

  // Search creators
  async searchCreators(filters: {
    category?: string;
    minFollowers?: number;
    maxFollowers?: number;
    location?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any> {
    return this.makeAPICall('/tcm/creator/search/', {
      ...filters,
      page: filters.page || 1,
      page_size: filters.pageSize || 20
    });
  }

  // Get creator performance metrics
  async getCreatorMetrics(creatorId: string, dateRange: { start: string; end: string }): Promise<any> {
    return this.makeAPICall('/tcm/creator/metrics/', {
      creator_id: creatorId,
      start_date: dateRange.start,
      end_date: dateRange.end
    });
  }

  // Private method to make API calls
  private async makeAPICall(endpoint: string, data?: any): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Access token not set. Please authenticate first.');
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken
        },
        body: JSON.stringify(data || {})
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(`TikTok API Error: ${result.message || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      console.error('TikTok API call failed:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: TIKTOK_APP_ID,
          secret: TIKTOK_APP_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const data = await response.json() as any;

      if (data.code === 0) {
        this.accessToken = data.data.access_token;
        return {
          access_token: data.data.access_token,
          expires_in: data.data.access_token_expire_time
        };
      } else {
        throw new Error(`TikTok API Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  // Get account information
  async getAccountInfo(): Promise<any> {
    return this.makeAPICall('/oauth2/advertiser/get/');
  }

  // Validate access token
  async validateToken(): Promise<boolean> {
    try {
      await this.getAccountInfo();
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
}

export const tiktokAPI = new TikTokAPI();