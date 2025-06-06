export class RateLimiter {
  private userLimits: Map<number, {
    hourly: { count: number; resetTime: number };
    daily: { count: number; resetTime: number };
  }>;

  private readonly HOURLY_LIMIT = 15; // TikTok's conservative limit
  private readonly DAILY_LIMIT = 200;

  constructor() {
    this.userLimits = new Map();
  }

  canSendInvitation(userId: number): boolean {
    const limits = this.getUserLimits(userId);
    const now = Date.now();

    // Reset counters if time has passed
    if (now >= limits.hourly.resetTime) {
      limits.hourly.count = 0;
      limits.hourly.resetTime = now + (60 * 60 * 1000); // 1 hour
    }

    if (now >= limits.daily.resetTime) {
      limits.daily.count = 0;
      limits.daily.resetTime = now + (24 * 60 * 60 * 1000); // 24 hours
    }

    // Check if under limits
    return limits.hourly.count < this.HOURLY_LIMIT && limits.daily.count < this.DAILY_LIMIT;
  }

  recordInvitation(userId: number): void {
    const limits = this.getUserLimits(userId);
    limits.hourly.count++;
    limits.daily.count++;
    this.userLimits.set(userId, limits);
  }

  getRemainingLimits(userId: number): { hourly: number; daily: number } {
    const limits = this.getUserLimits(userId);
    return {
      hourly: Math.max(0, this.HOURLY_LIMIT - limits.hourly.count),
      daily: Math.max(0, this.DAILY_LIMIT - limits.daily.count)
    };
  }

  getResetTimes(userId: number): { hourly: number; daily: number } {
    const limits = this.getUserLimits(userId);
    return {
      hourly: limits.hourly.resetTime,
      daily: limits.daily.resetTime
    };
  }

  private getUserLimits(userId: number) {
    if (!this.userLimits.has(userId)) {
      const now = Date.now();
      this.userLimits.set(userId, {
        hourly: { count: 0, resetTime: now + (60 * 60 * 1000) },
        daily: { count: 0, resetTime: now + (24 * 60 * 60 * 1000) }
      });
    }
    return this.userLimits.get(userId)!;
  }

  // Calculate optimal delay between invitations
  getOptimalDelay(userId: number): number {
    const remaining = this.getRemainingLimits(userId);
    const now = Date.now();
    const resetTime = this.getResetTimes(userId);
    
    // If close to hourly limit, increase delay
    if (remaining.hourly <= 3) {
      const timeToReset = resetTime.hourly - now;
      return Math.min(timeToReset / remaining.hourly, 20 * 60 * 1000); // Max 20 minutes
    }

    // Normal delay: 2-10 minutes
    return Math.random() * (10 - 2) + 2; // 2-10 minutes in milliseconds
  }
}
