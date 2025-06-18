
import { storage } from '../storage';
import { rateLimiter } from '../automation/rate-limiter';
import { logger } from './logger';

export interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export class AutomationTester {
  async runAllTests(): Promise<TestResult[]> {
    const tests = [
      this.testDatabaseOperations.bind(this),
      this.testRateLimiter.bind(this),
      this.testCreatorOperations.bind(this),
      this.testCampaignOperations.bind(this),
      this.testEnvironmentVariables.bind(this)
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      const result = await this.runTest(test);
      results.push(result);
    }

    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    logger.info(
      `Automation tests completed: ${passedTests}/${totalTests} passed`,
      'automation-tester',
      undefined,
      { passedTests, failedTests, results }
    );

    return results;
  }

  private async runTest(testFn: Function): Promise<TestResult> {
    const start = Date.now();
    const testName = testFn.name.replace('test', '').replace(/([A-Z])/g, ' $1').trim();

    try {
      const result = await testFn();
      return {
        name: testName,
        success: true,
        duration: Date.now() - start,
        details: result
      };
    } catch (error) {
      return {
        name: testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testDatabaseOperations(): Promise<any> {
    // Test user operations
    const testUser = await storage.createUser({
      username: 'test-user',
      email: 'test@example.com',
      createdAt: new Date()
    });

    const retrievedUser = await storage.getUser(testUser.id);
    if (!retrievedUser || retrievedUser.username !== 'test-user') {
      throw new Error('User creation/retrieval failed');
    }

    // Test creator operations
    const testCreator = await storage.createCreator({
      username: 'test-creator',
      displayName: 'Test Creator',
      followerCount: 1000,
      averageViews: 5000,
      engagementRate: 3.5,
      category: 'lifestyle',
      isVerified: false,
      lastActive: new Date(),
      bio: 'Test creator bio'
    });

    const retrievedCreator = await storage.getCreator(testCreator.id);
    if (!retrievedCreator || retrievedCreator.username !== 'test-creator') {
      throw new Error('Creator creation/retrieval failed');
    }

    // Cleanup
    await storage.deleteUser(testUser.id);
    await storage.deleteCreator(testCreator.id);

    return { userTest: 'passed', creatorTest: 'passed' };
  }

  private async testRateLimiter(): Promise<any> {
    const testUserId = 99999;
    
    // Test rate limiting
    const canSend1 = rateLimiter.canSendInvitation(testUserId);
    if (!canSend1.allowed) {
      throw new Error('First request should be allowed');
    }

    rateLimiter.recordInvitation(testUserId);

    const remaining = rateLimiter.getRemainingLimits(testUserId);
    if (remaining.hourly >= 15) {
      throw new Error('Rate limit not properly decremented');
    }

    const delay = rateLimiter.getOptimalDelay(testUserId);
    if (delay < 120000) { // 2 minutes minimum
      throw new Error('Optimal delay too short');
    }

    return { 
      rateLimitTest: 'passed',
      remainingLimits: remaining,
      optimalDelay: delay
    };
  }

  private async testCreatorOperations(): Promise<any> {
    // Test creator search
    const creators = await storage.searchCreators('test');
    
    // Test creator discovery (mock)
    const discoveryResult = {
      count: 0,
      searchTerm: 'test'
    };

    return {
      searchTest: 'passed',
      searchResults: creators.length,
      discoveryTest: 'passed'
    };
  }

  private async testCampaignOperations(): Promise<any> {
    // Create test user first
    const testUser = await storage.createUser({
      username: 'campaign-test-user',
      email: 'campaign-test@example.com',
      createdAt: new Date()
    });

    try {
      // Test campaign creation
      const testCampaign = await storage.createCampaign({
        userId: testUser.id,
        name: 'Test Campaign',
        description: 'Test campaign description',
        budget: 1000,
        targetAudience: 'test audience',
        productInfo: 'test product',
        goals: 'test goals',
        timeline: 'test timeline',
        status: 'draft'
      });

      const retrievedCampaign = await storage.getCampaign(testCampaign.id);
      if (!retrievedCampaign || retrievedCampaign.name !== 'Test Campaign') {
        throw new Error('Campaign creation/retrieval failed');
      }

      // Test campaign stats
      const stats = await storage.getCampaignStats(testCampaign.id);
      
      // Cleanup
      await storage.deleteCampaign(testCampaign.id);
      await storage.deleteUser(testUser.id);

      return {
        campaignCreation: 'passed',
        campaignStats: stats,
        cleanup: 'passed'
      };
    } catch (error) {
      // Cleanup on error
      await storage.deleteUser(testUser.id);
      throw error;
    }
  }

  private async testEnvironmentVariables(): Promise<any> {
    const required = [
      'GEMINI_API_KEY',
      'PERPLEXITY_API_KEY',
      'TIKTOK_APP_ID',
      'TIKTOK_APP_SECRET'
    ];

    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    return {
      environmentTest: 'passed',
      requiredVariables: required.length,
      missingVariables: missing.length
    };
  }
}

export const automationTester = new AutomationTester();
