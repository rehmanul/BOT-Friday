
import { Request, Response } from 'express';
import { storage } from '../storage';
import { rateLimiter } from '../automation/rate-limiter';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceStatus;
    rateLimiter: ServiceStatus;
    filesystem: ServiceStatus;
    memory: ServiceStatus;
  };
  metrics?: any;
}

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRateLimiter(),
      this.checkFilesystem(),
      this.checkMemory()
    ]);

    const [database, rateLimiterCheck, filesystem, memory] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        status: 'unhealthy' as const, 
        error: result.reason?.message || 'Unknown error' 
      }
    );

    const overallStatus = this.determineOverallStatus([database, rateLimiterCheck, filesystem, memory]);

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database,
        rateLimiter: rateLimiterCheck,
        filesystem,
        memory
      }
    };

    // Add metrics if healthy
    if (overallStatus === 'healthy') {
      health.metrics = rateLimiter.getMetrics();
    }

    logger.debug('Health check completed', 'health-check', undefined, { status: overallStatus });

    return health;
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      // Test database connection
      await storage.getUsers();
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Database check failed'
      };
    }
  }

  private async checkRateLimiter(): Promise<ServiceStatus> {
    try {
      const metrics = rateLimiter.getMetrics();
      return {
        status: 'healthy',
        details: metrics
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Rate limiter check failed'
      };
    }
  }

  private async checkFilesystem(): Promise<ServiceStatus> {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const testFile = path.join(logDir, 'health-check.tmp');
      
      // Test write
      fs.writeFileSync(testFile, 'health-check');
      
      // Test read
      const content = fs.readFileSync(testFile, 'utf-8');
      
      // Cleanup
      fs.unlinkSync(testFile);
      
      if (content !== 'health-check') {
        throw new Error('File content mismatch');
      }

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Filesystem check failed'
      };
    }
  }

  private async checkMemory(): Promise<ServiceStatus> {
    try {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal + usage.external;
      const usedMemory = usage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      const status = memoryUsagePercent > 90 ? 'unhealthy' : 
                   memoryUsagePercent > 70 ? 'degraded' : 'healthy';

      return {
        status,
        details: {
          memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
          heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
          external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Memory check failed'
      };
    }
  }

  private determineOverallStatus(services: ServiceStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthy = services.some(s => s.status === 'unhealthy');
    const degraded = services.some(s => s.status === 'degraded');

    if (unhealthy) return 'unhealthy';
    if (degraded) return 'degraded';
    return 'healthy';
  }
}

export const healthChecker = new HealthChecker();

export const healthCheckHandler = async (req: Request, res: Response) => {
  try {
    const health = await healthChecker.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', 'health-check', undefined, error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};
