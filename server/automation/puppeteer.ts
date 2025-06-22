import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import UserAgent from 'user-agents';
import { logger } from '../utils/logger';
import type { Browser, Page } from 'puppeteer-core';

// Add stealth plugin and adblocker
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export class PuppeteerAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isInitialized = false;
  private userAgent = new UserAgent({ deviceCategory: 'desktop' });

  async initializeSession(): Promise<void> {
    try {
      logger.info('Initializing Puppeteer session...', 'puppeteer');

      // Configure launch options based on environment
      const launchOptions = this.getLaunchOptions();

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();

      // Set user agent
      await this.page.setUserAgent(this.userAgent.toString());

      // Set viewport
      await this.page.setViewport({
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
      });

      // Set additional headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      this.isInitialized = true;
      logger.info('Puppeteer session initialized successfully', 'puppeteer');

    } catch (error) {
      logger.error('Failed to initialize Puppeteer session', 'puppeteer', undefined, error);
      this.isInitialized = false;

      // Don't throw in production - just disable automation features
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Automation features will be disabled', 'puppeteer');
      } else {
        throw error;
      }
    }
  }

  private getLaunchOptions() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Render.com specific configuration
      return {
        headless: 'new' as const,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-default-apps',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ],
        // Try multiple possible Chrome paths on Render
        executablePath: this.findChromePath(),
      };
    } else {
      // Development configuration
      return {
        headless: false,
        devtools: true,
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
      };
    }
  }

  private findChromePath(): string | undefined {
    // Common Chrome paths on different systems
    const possiblePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/opt/google/chrome/chrome',
      '/snap/bin/chromium',
      process.env.CHROME_PATH,
      process.env.CHROMIUM_PATH,
    ].filter(Boolean);

    const fs = require('fs');

    for (const path of possiblePaths) {
      try {
        if (path && fs.existsSync(path)) {
          logger.info(`Found Chrome at: ${path}`, 'puppeteer');
          return path;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    logger.warn('Chrome executable not found, will use bundled Chromium', 'puppeteer');
    return undefined; // Let Puppeteer use bundled Chromium
  }

  isReady(): boolean {
    return this.isInitialized && this.browser !== null && this.page !== null;
  }

  async navigateToTikTok(): Promise<boolean> {
    if (!this.isReady()) {
      logger.warn('Puppeteer session not ready', 'puppeteer');
      return false;
    }

    try {
      await this.page!.goto('https://www.tiktok.com', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      logger.info('Successfully navigated to TikTok', 'puppeteer');
      return true;
    } catch (error) {
      logger.error('Failed to navigate to TikTok', 'puppeteer', undefined, error);
      return false;
    }
  }

  async captureSessionData(): Promise<any> {
    if (!this.isReady()) {
      return {
        initialized: false,
        message: 'Puppeteer session not ready'
      };
    }

    try {
      const cookies = await this.page!.cookies();
      const url = this.page!.url();
      const title = await this.page!.title();

      return {
        initialized: true,
        url,
        title,
        cookieCount: cookies.length,
        userAgent: await this.page!.evaluate(() => navigator.userAgent),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to capture session data', 'puppeteer', undefined, error);
      return {
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.isInitialized = false;
      logger.info('Puppeteer session cleaned up successfully', 'puppeteer');
    } catch (error) {
      logger.error('Error during Puppeteer cleanup', 'puppeteer', undefined, error);
    }
  }
}