
import { logger } from '../utils/logger';

export interface RateLimit {
  count: number;
  resetTime: number;
  lastRequest?: number;
}

export interface UserLimits {
  hourly: RateLimit;
  daily: RateLimit;
  weekly: RateLimit;
}

export class RateLimiter {
  private userLimits: Map<number, UserLimits>;
  private readonly HOURLY_LIMIT = parseInt(process.env.TIKTOK_HOURLY_LIMIT || '15');
  private readonly DAILY_LIMIT = parseInt(process.env.TIKTOK_DAILY_LIMIT || '200');
  private readonly WEEKLY_LIMIT = parseInt(process.env.TIKTOK_WEEKLY_LIMIT || '1000');
  private readonly MIN_DELAY_MS = parseInt(process.env.MIN_REQUEST_DELAY_MS || '120000'); // 2 minutes

  constructor() {
    this.userLimits = new Map();
    logger.info('Rate limiter initialized', 'rate-limiter', undefined, {
      hourlyLimit: this.HOURLY_LIMIT,
      dailyLimit: this.DAILY_LIMIT,
      weeklyLimit: this.WEEKLY_LIMIT,
      minDelayMs: this.MIN_DELAY_MS
    });
  }

  canSendInvitation(userId: number): { allowed: boolean; reason?: string; resetTime?: number } {
    const limits = this.getUserLimits(userId);
    const now = Date.now();

    // Reset counters if time has passed
    this.resetExpiredLimits(limits, now);

    // Check minimum delay between requests
    if (limits.hourly.lastRequest && (now - limits.hourly.lastRequest) < this.MIN_DELAY_MS) {
      const waitTime = this.MIN_DELAY_MS - (now - limits.hourly.lastRequest);
      logger.warn(`Rate limit: minimum delay not met for user ${userId}`, 'rate-limiter', userId, {
        waitTimeMs: waitTime,
        lastRequest: limits.hourly.lastRequest
      });
      return {
        allowed: false,
        reason: 'Minimum delay between requests not met',
        resetTime: limits.hourly.lastRequest + this.MIN_DELAY_MS
      };
    }

    // Check hourly limit
    if (limits.hourly.count >= this.HOURLY_LIMIT) {
      logger.warn(`Rate limit: hourly limit exceeded for user ${userId}`, 'rate-limiter', userId, {
        currentCount: limits.hourly.count,
        limit: this.HOURLY_LIMIT,
        resetTime: limits.hourly.resetTime
      });
      return {
        allowed: false,
        reason: 'Hourly limit exceeded',
        resetTime: limits.hourly.resetTime
      };
    }

    // Check daily limit
    if (limits.daily.count >= this.DAILY_LIMIT) {
      logger.warn(`Rate limit: daily limit exceeded for user ${userId}`, 'rate-limiter', userId, {
        currentCount: limits.daily.count,
        limit: this.DAILY_LIMIT,
        resetTime: limits.daily.resetTime
      });
      return {
        allowed: false,
        reason: 'Daily limit exceeded',
        resetTime: limits.daily.resetTime
      };
    }

    // Check weekly limit
    if (limits.weekly.count >= this.WEEKLY_LIMIT) {
      logger.warn(`Rate limit: weekly limit exceeded for user ${userId}`, 'rate-limiter', userId, {
        currentCount: limits.weekly.count,
        limit: this.WEEKLY_LIMIT,
        resetTime: limits.weekly.resetTime
      });
      return {
        allowed: false,
        reason: 'Weekly limit exceeded',
        resetTime: limits.weekly.resetTime
      };
    }

    return { allowed: true };
  }

  recordInvitation(userId: number): void {
    const limits = this.getUserLimits(userId);
    const now = Date.now();

    limits.hourly.count++;
    limits.hourly.lastRequest = now;
    limits.daily.count++;
    limits.weekly.count++;

    this.userLimits.set(userId, limits);

    logger.info(`Invitation recorded for user ${userId}`, 'rate-limiter', userId, {
      hourlyCount: limits.hourly.count,
      dailyCount: limits.daily.count,
      weeklyCount: limits.weekly.count
    });
  }

  getRemainingLimits(userId: number): { hourly: number; daily: number; weekly: number } {
    const limits = this.getUserLimits(userId);
    const now = Date.now();
    this.resetExpiredLimits(limits, now);

    return {
      hourly: Math.max(0, this.HOURLY_LIMIT - limits.hourly.count),
      daily: Math.max(0, this.DAILY_LIMIT - limits.daily.count),
      weekly: Math.max(0, this.WEEKLY_LIMIT - limits.weekly.count)
    };
  }

  getResetTimes(userId: number): { hourly: number; daily: number; weekly: number } {
    const limits = this.getUserLimits(userId);
    return {
      hourly: limits.hourly.resetTime,
      daily: limits.daily.resetTime,
      weekly: limits.weekly.resetTime
    };
  }

  getOptimalDelay(userId: number): number {
    const remaining = this.getRemainingLimits(userId);
    const now = Date.now();
    const resetTime = this.getResetTimes(userId);
    
    // If close to hourly limit, increase delay
    if (remaining.hourly <= 3) {
      const timeToReset = resetTime.hourly - now;
      return Math.min(timeToReset / remaining.hourly, 20 * 60 * 1000); // Max 20 minutes
    }

    // Normal delay: 2-10 minutes with some randomization
    const baseDelay = Math.random() * (10 - 2) + 2; // 2-10 minutes
    return Math.max(baseDelay * 60 * 1000, this.MIN_DELAY_MS);
  }

  private getUserLimits(userId: number): UserLimits {
    if (!this.userLimits.has(userId)) {
      const now = Date.now();
      this.userLimits.set(userId, {
        hourly: { count: 0, resetTime: now + (60 * 60 * 1000) },
        daily: { count: 0, resetTime: now + (24 * 60 * 60 * 1000) },
        weekly: { count: 0, resetTime: now + (7 * 24 * 60 * 60 * 1000) }
      });
    }
    return this.userLimits.get(userId)!;
  }

  private resetExpiredLimits(limits: UserLimits, now: number): void {
    if (now >= limits.hourly.resetTime) {
      limits.hourly.count = 0;
      limits.hourly.resetTime = now + (60 * 60 * 1000);
      limits.hourly.lastRequest = undefined;
    }

    if (now >= limits.daily.resetTime) {
      limits.daily.count = 0;
      limits.daily.resetTime = now + (24 * 60 * 60 * 1000);
    }

    if (now >= limits.weekly.resetTime) {
      limits.weekly.count = 0;
      limits.weekly.resetTime = now + (7 * 24 * 60 * 60 * 1000);
    }
  }

  // Get metrics for monitoring
  getMetrics(): any {
    const users = Array.from(this.userLimits.keys());
    const totalUsers = users.length;
    let totalHourlyRequests = 0;
    let totalDailyRequests = 0;
    let totalWeeklyRequests = 0;

    users.forEach(userId => {
      const limits = this.getUserLimits(userId);
      totalHourlyRequests += limits.hourly.count;
      totalDailyRequests += limits.daily.count;
      totalWeeklyRequests += limits.weekly.count;
    });

    return {
      totalUsers,
      totalHourlyRequests,
      totalDailyRequests,
      totalWeeklyRequests,
      limits: {
        hourly: this.HOURLY_LIMIT,
        daily: this.DAILY_LIMIT,
        weekly: this.WEEKLY_LIMIT
      }
    };
  }
}

export const rateLimiter = new RateLimiter();
