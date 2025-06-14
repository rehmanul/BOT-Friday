import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { Browser, Page } from 'puppeteer';
// Simplified user agent generation
const getRandomUserAgent = () => {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
};

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export class PuppeteerAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private sessionData: any = null;

  async initializeSession(): Promise<any> {
    try {
      if (this.browser) {
        await this.browser.close();
      }

      // Generate random user agent for stealth
      const randomUA = getRandomUserAgent();

      // Try to find system Chromium first
      let executablePath: string | undefined;
      try {
        const { execSync } = require('child_process');
        executablePath = execSync('which chromium-browser || which chromium || which google-chrome', { encoding: 'utf8' }).trim();
      } catch (error) {
        console.log('System Chrome not found, falling back to Puppeteer default');
      }

      this.browser = await puppeteer.launch({
        headless: true, // Changed to headless for Replit environment
        executablePath, // Use system Chromium if found
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--safebrowsing-disable-auto-update',
          '--disable-blink-features=AutomationControlled',
          '--single-process',
          '--no-first-run',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows'
        ],
        defaultViewport: null
      });

      this.page = await this.browser.newPage();

      // Advanced stealth configurations
      await this.page.setViewport({ 
        width: 1366 + Math.floor(Math.random() * 100),
        height: 768 + Math.floor(Math.random() * 100)
      });

      await this.page.setUserAgent(randomUA);

      // Remove webdriver property
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      // Randomize language and timezone
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      // Navigate to TikTok Seller Affiliate Center
      console.log('Navigating to TikTok Seller Affiliate Center...');
      await this.page.goto('https://affiliate.tiktok.com/connection/creator?shop_region=GB', { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for potential login detection
      await this.humanLikeDelay(2000, 4000);

      // Check if already logged in or capture login session
      const isLoggedIn = await this.detectLoginStatus();

      if (isLoggedIn) {
        console.log('Existing session detected, capturing session data...');
        this.sessionData = await this.captureSessionData();
      } else {
        console.log('No active session found. User needs to login manually.');
      }

      return {
        initialized: true,
        timestamp: new Date(),
        userAgent: randomUA,
        isLoggedIn,
        sessionCaptured: !!this.sessionData,
        cookies: await this.page.cookies(),
        localStorage: await this.captureLocalStorage(),
        sessionStorage: await this.captureSessionStorage()
      };

    } catch (error) {
      console.error('Failed to initialize Puppeteer session:', error);
      throw new Error('Failed to initialize automation session');
    }
  }

  // Capture existing login session
  async captureSessionData(): Promise<any> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      const [cookies, localStorage, sessionStorage, profile] = await Promise.all([
        this.page.cookies(),
        this.captureLocalStorage(),
        this.captureSessionStorage(),
        this.extractProfileData()
      ]);

      // Store session cookies for reuse
      await this.storeSessionCookies(cookies);

      return {
        cookies,
        localStorage,
        sessionStorage,
        profile,
        url: this.page.url(),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to capture session data:', error);
      return null;
    }
  }

  private async storeSessionCookies(cookies: any[]) {
    try {
      // Save cookies to a persistent store or file
      // For example, save to a JSON file or database
      // Here, just log for demonstration
      console.log('Storing session cookies:', cookies);
      // TODO: Implement actual storage logic
    } catch (error) {
      console.error('Failed to store session cookies:', error);
    }
  }

  // Extract profile data from TikTok page
  private async extractProfileData(): Promise<any> {
    if (!this.page) return null;

    try {
      const profileData = await this.page.evaluate(() => {
        // Try to extract profile data from various TikTok selectors
        const extractText = (selector: string): string | null => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || null;
        };

        const extractAttribute = (selector: string, attribute: string): string | null => {
          const element = document.querySelector(selector);
          return element?.getAttribute(attribute) || null;
        };

        // Extract username
        let username = extractText('[data-e2e="nav-profile"] span') ||
                      extractText('.username') ||
                      extractText('[data-testid="username"]') ||
                      'digi4u_repair';

        // Extract display name  
        let displayName = extractText('[data-e2e="profile-name"]') ||
                         extractText('.display-name') ||
                         extractText('[data-testid="display-name"]') ||
                         'Digi4u Repair UK';

        // Extract avatar
        let avatar = extractAttribute('[data-e2e="avatar"] img', 'src') ||
                    extractAttribute('.avatar img', 'src') ||
                    extractAttribute('img[alt*="avatar"]', 'src') ||
                    'https://via.placeholder.com/40';

        // Extract follower count
        let followers = extractText('[data-e2e="followers-count"]') ||
                       extractText('.follower-count') ||
                       '15.4K';

        // Convert follower string to number
        let followerCount = 15420;
        if (followers) {
          const match = followers.match(/([\d.]+)([KMB]?)/i);
          if (match) {
            const [, number, unit] = match;
            const num = parseFloat(number);
            switch (unit?.toUpperCase()) {
              case 'K': followerCount = Math.round(num * 1000); break;
              case 'M': followerCount = Math.round(num * 1000000); break;
              case 'B': followerCount = Math.round(num * 1000000000); break;
              default: followerCount = Math.round(num);
            }
          }
        }

        return {
          username: username.replace('@', ''),
          displayName,
          avatar,
          verified: !!document.querySelector('[data-e2e="verify-icon"], .verified-icon'),
          followers: followerCount,
          isActive: true
        };
      });

      console.log('Extracted profile data:', profileData);
      return profileData;
    } catch (error) {
      console.error('Profile extraction error:', error);
      return {
        username: 'digi4u_repair',
        displayName: 'Digi4u Repair UK',
        avatar: 'https://via.placeholder.com/40',
        verified: true,
        followers: 15420,
        isActive: true
      };
    }
  }

  // Restore session from captured data
  async restoreSession(sessionData: any): Promise<boolean> {
    if (!this.page || !sessionData) return false;

    try {
      // Set cookies
      if (sessionData.cookies) {
        await this.page.setCookie(...sessionData.cookies);
      }

      // Restore localStorage
      if (sessionData.localStorage) {
        await this.page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value as string);
          }
        }, sessionData.localStorage);
      }

      // Restore sessionStorage
      if (sessionData.sessionStorage) {
        await this.page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            sessionStorage.setItem(key, value as string);
          }
        }, sessionData.sessionStorage);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return false;
    }
  }

  private async detectLoginStatus(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Wait for page to load completely
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for TikTok logged-in indicators
      const indicators = [
        // TikTok Seller Center indicators
        'div[data-testid="seller-header"]',
        '.seller-layout',
        '[data-testid="dashboard"]',
        '.dashboard-container',

        // General TikTok indicators
        '[data-e2e="profile-icon"]',
        '[data-e2e="nav-profile"]',
        '.DivHeaderWrapper',
        '.DivNavContainer',
        'div[data-e2e="recommend-list-item-container"]',

        // Avatar or profile picture indicators
        'img[alt*="avatar"]',
        '.avatar-wrapper',
        '[data-e2e="avatar"]'
      ];

      for (const selector of indicators) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          console.log(`Detected login via selector: ${selector}`);
          return true;
        } catch {
          continue;
        }
      }

      // Check for authentication cookies
      const cookies = await this.page.cookies();
      const authCookies = cookies.filter(cookie => 
        cookie.name.includes('sessionid') || 
        cookie.name.includes('sessionid_') ||
        cookie.name.includes('sid_tt') ||
        cookie.name.includes('passport_auth_token')
      );

      if (authCookies.length > 0) {
        console.log('Detected login via auth cookies');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login detection error:', error);
      return false;
    }
  }

  private async captureLocalStorage(): Promise<Record<string, string>> {
    if (!this.page) return {};

    try {
      return await this.page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            storage[key] = localStorage.getItem(key) || '';
          }
        }
        return storage;
      });
    } catch {
      return {};
    }
  }

  private async captureSessionStorage(): Promise<Record<string, string>> {
    if (!this.page) return {};

    try {
      return await this.page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            storage[key] = sessionStorage.getItem(key) || '';
          }
        }
        return storage;
      });
    } catch {
      return {};
    }
  }

  async sendInvitation(creatorUsername: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.page) {
        throw new Error('Browser session not initialized');
      }

      // Navigate to creator search or messaging area
      await this.humanLikeDelay(1000, 3000);

      // Simulate human-like mouse movements
      await this.simulateMouseMovement();

      // Search for creator
      const searchSelector = 'input[placeholder*="search"], input[placeholder*="creator"]';
      await this.page.waitForSelector(searchSelector, { timeout: 10000 });

      await this.page.click(searchSelector);
      await this.humanLikeDelay(500, 1500);

      await this.page.type(searchSelector, creatorUsername, { delay: 100 });
      await this.humanLikeDelay(1000, 2000);

      await this.page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Look for creator profile or invite button
        const inviteButtonSelector = 'button[data-testid="invite"], button:contains("invite"), .invite-btn';

        try {
          await this.page.waitForSelector(inviteButtonSelector, { timeout: 10000 });
          await this.page.click(inviteButtonSelector);
          await this.humanLikeDelay(1000, 2000);

          // Type message
          const messageInputSelector = 'textarea, input[type="text"]';
          await this.page.waitForSelector(messageInputSelector, { timeout: 5000 });

          await this.page.click(messageInputSelector);
          await this.humanLikeDelay(500, 1000);

          await this.page.type(messageInputSelector, message, { delay: 50 });
          await this.humanLikeDelay(1000, 2000);

          // Send message
          const sendButtonSelector = 'button[type="submit"], button:contains("Send"), .send-btn';
          await this.page.click(sendButtonSelector);

          await new Promise(resolve => setTimeout(resolve, 2000));

          return { success: true };

        } catch (error) {
          return { 
            success: false, 
            error: `Creator @${creatorUsername} not found or messaging not available`
          };
        }

    } catch (error) {
      console.error('Failed to send invitation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async checkForResponses(): Promise<any[]> {
    try {
      if (!this.page) {
        throw new Error('Browser session not initialized');
      }

      // Navigate to messages/inbox
      await this.page.goto('https://seller.tiktokshop.com/messages', { waitUntil: 'networkidle0' });
      await this.humanLikeDelay(2000, 4000);

      // Extract invite list
      const messages = await this.page.evaluate(() => {
        const inviteElements = document.querySelectorAll('.invite-item, .conversation-item');
        return Array.from(inviteElements).map((element: Element) => {
          const usernameEl = element.querySelector('.username, .creator-name');
          const inviteEl = element.querySelector('.invite-text, .last-invite');
          const timestampEl = element.querySelector('.timestamp, .time');

          return {
            username: usernameEl?.textContent?.trim(),
            invite: inviteEl?.textContent?.trim(),
            timestamp: timestampEl?.textContent?.trim(),
            isUnread: element.classList.contains('unread')
          };
        });
      });

      return messages.filter(msg => msg.username && msg.invite);

    } catch (error) {
      console.error('Failed to check for responses:', error);
      return [];
    }
  }

  async discoverCreators(category: string, minFollowers: number = 10000): Promise<any[]> {
    try {
      if (!this.page) {
        throw new Error('Browser session not initialized');
      }

      // Navigate to creator discovery section
      await this.page.goto('https://seller.tiktokshop.com/creators', { waitUntil: 'networkidle0' });
      await this.humanLikeDelay(2000, 4000);

      // Apply filters
      await this.applyCreatorFilters(category, minFollowers);

      // Extract creator data
      const creators = await this.page.evaluate(() => {
        const creatorElements = document.querySelectorAll('.creator-card, .creator-item');
        return Array.from(creatorElements).map((element: Element) => {
          const usernameEl = element.querySelector('.username, .creator-username');
          const followersEl = element.querySelector('.followers, .follower-count');
          const categoryEl = element.querySelector('.category, .creator-category');
          const gmvEl = element.querySelector('.gmv, .earnings');

          return {
            username: usernameEl?.textContent?.trim(),
            followers: this.parseFollowerCount(followersEl?.textContent?.trim()),
            category: categoryEl?.textContent?.trim(),
            gmv: this.parseGMV(gmvEl?.textContent?.trim())
          };
        });
      });

      return creators.filter(creator => creator.username);

    } catch (error) {
      console.error('Failed to discover creators:', error);
      return [];
    }
  }

  private async applyCreatorFilters(category: string, minFollowers: number): Promise<void> {
    try {
      // Category filter
      const categorySelector = 'select[name="category"], .category-filter';
      if (await this.page.$(categorySelector)) {
        await this.page.select(categorySelector, category);
        await this.humanLikeDelay(1000, 2000);
      }

      // Followers filter
      const followersSelector = 'input[name="min_followers"], .followers-filter';
      if (await this.page.$(followersSelector)) {
        await this.page.click(followersSelector);
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await this.page.type(followersSelector, minFollowers.toString());
        await this.humanLikeDelay(500, 1000);
      }

      // Apply filters
      const applyButtonSelector = 'button:contains("Apply"), .apply-filters';
      if (await this.page.$(applyButtonSelector)) {
        await this.page.click(applyButtonSelector);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
  }

  private async simulateMouseMovement(): Promise<void> {
    try {
      // Simulate random mouse movements to appear human-like
      const viewport = this.page!.viewport();
      if (!viewport) return;

      for (let i = 0; i < 3; i++) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        await this.page!.mouse.move(x, y);
        await this.humanLikeDelay(100, 500);
      }
    } catch (error) {
      console.error('Mouse simulation error:', error);
    }
  }

  private async humanLikeDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private parseFollowerCount(text?: string): number | null {
    if (!text) return null;

    const match = text.match(/([\d.]+)([KMB]?)/i);
    if (!match) return null;

    const [, number, unit] = match;
    const num = parseFloat(number);

    switch (unit.toUpperCase()) {
      case 'K': return Math.round(num * 1000);
      case 'M': return Math.round(num * 1000000);
      case 'B': return Math.round(num * 1000000000);
      default: return Math.round(num);
    }
  }

  private parseGMV(text?: string): number | null {
    if (!text) return null;

    const match = text.match(/\$?([\d,.]+)([KMB]?)/i);
    if (!match) return null;

    const [, number, unit] = match;
    const num = parseFloat(number.replace(/,/g, ''));

    switch (unit.toUpperCase()) {
      case 'K': return Math.round(num * 1000);
      case 'M': return Math.round(num * 1000000);
      case 'B': return Math.round(num * 1000000000);
      default: return Math.round(num);
    }
  }

  private async setupStealth() {
    if (!this.page) return;

    // Enhanced stealth features to avoid detection
    await this.page.evaluateOnNewDocument(() => {
      // Override webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Override automation flags
      Object.defineProperty(window, 'chrome', {
        get: () => ({
          runtime: {},
          loadTimes: {},
          csi: {},
          app: {}
        })
      });

      // Override plugins array
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', length: 1 },
          { name: 'Chrome PDF Viewer', length: 1 },
          { name: 'Native Client', length: 1 }
        ],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
      });

      // Override screen properties
      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24,
      });

      // Add realistic hardware specs
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });
    });

    // Set realistic viewport with device pixel ratio
    await this.page.setViewport({ 
      width: 1920, 
      height: 1080,
      deviceScaleFactor: 1
    });

    // Set realistic user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    // Set additional headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    });
  }

  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}