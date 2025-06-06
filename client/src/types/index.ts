// Campaign types
export interface Campaign {
  id: number;
  userId: number;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'stopped';
  targetInvitations: number;
  dailyLimit: number;
  invitationTemplate: string;
  humanLikeDelays: boolean;
  aiOptimization: boolean;
  filters: any;
  sentCount: number;
  responseCount: number;
  conversionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  userId: number;
  name: string;
  targetInvitations: number;
  dailyLimit: number;
  invitationTemplate: string;
  humanLikeDelays?: boolean;
  aiOptimization?: boolean;
  filters?: any;
}

// Creator types
export interface Creator {
  id: number;
  username: string;
  displayName: string | null;
  followers: number | null;
  category: string | null;
  engagementRate: string | null;
  gmv: string | null;
  profileData: any;
  lastUpdated: string;
  createdAt: string;
}

export interface CreatorFilters {
  category?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minGMV?: number;
  maxGMV?: number;
  engagementRate?: string;
}

// Campaign Invitation types
export interface CampaignInvitation {
  id: number;
  campaignId: number;
  creatorId: number;
  status: 'pending' | 'sent' | 'responded' | 'failed' | 'skipped';
  invitationText: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  responseText: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

// Activity Log types
export interface ActivityLog {
  id: number;
  userId: number;
  campaignId: number | null;
  type: string;
  message: string;
  metadata: any;
  timestamp: string;
}

// Browser Session types
export interface BrowserSession {
  id: number;
  userId: number;
  sessionData: any;
  isActive: boolean;
  lastActivity: string;
  expiresAt: string | null;
  createdAt: string;
}

// Dashboard Stats types
export interface DashboardStats {
  activeCampaigns: number;
  creatorsContacted: number;
  responseRate: number;
  totalGMV: number;
}

// Campaign Stats types
export interface CampaignStats {
  sent: number;
  responses: number;
  pending: number;
  responseRate: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data?: any;
  campaign?: number;
  creator?: Creator;
  session?: BrowserSession;
}

// Rate Limit types
export interface RateLimits {
  hourly: number;
  daily: number;
  resetTimes: {
    hourly: number;
    daily: number;
  };
}

// Automation Status types
export interface AutomationStatus {
  isActive: boolean;
  currentCampaign?: Campaign;
  rateLimits: RateLimits;
  performance: {
    successRate: number;
    avgResponseTime: string;
  };
}
