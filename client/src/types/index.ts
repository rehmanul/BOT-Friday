// Import types from the shared schema
export type {
  User,
  InsertUser,
  Campaign,
  InsertCampaign,
  Creator,
  InsertCreator,
  CampaignInvitation,
  InsertCampaignInvitation,
  BrowserSession,
  InsertBrowserSession,
  ActivityLog,
  InsertActivityLog,
} from "@shared/sqlite-schema";

// Dashboard specific types
export interface DashboardStats {
  activeCampaigns: number;
  creatorsContacted: number;
  responseRate: number;
  totalGMV: number;
  totalSpent: number;
  conversionRate: number;
}

// Campaign creation data
export interface CreateCampaignData {
  name: string;
  targetInvitations: number;
  dailyLimit: number;
  invitationTemplate: string;
  status?: string;
  humanLikeDelays?: boolean;
  aiOptimization?: boolean;
  filters?: any;
}

// Campaign stats
export interface CampaignStats {
  sentCount: number;
  responseCount: number;
  conversionCount: number;
  responseRate: number;
  conversionRate: number;
  totalSpent: number;
  averageResponseTime: number;
}

// Real-time activity
export interface ActivityItem {
  id: number;
  userId: number;
  action: string;
  details: string;
  timestamp: Date;
  status?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

// Creator filters
export interface CreatorFilters {
  category?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
  maxEngagement?: number;
  location?: string;
  verified?: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}