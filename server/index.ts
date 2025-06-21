
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, setBroadcastFunction } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { PuppeteerAutomation } from "./automation/puppeteer";
import { errorHandler, AppError } from "./middleware/error-handler";
import { logger } from "./utils/logger";
import { validateEnvironment, getEnvironmentInfo } from "./utils/env-validator";
import { healthCheckHandler } from "./middleware/health-check";

const app = express();

// Validate environment variables on startup
if (!validateEnvironment()) {
  logger.error('Environment validation failed, server will not start', 'server');
  process.exit(1);
}

logger.info('Server starting up', 'server', undefined, getEnvironmentInfo());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:;");
  res.setHeader('X-Powered-By', ''); // Remove server info
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path.startsWith("/health")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log response body for errors in production
      if (capturedJsonResponse && (res.statusCode >= 400 || process.env.NODE_ENV !== 'production')) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      // Log based on status code
      if (res.statusCode >= 500) {
        logger.error(logLine, 'http');
      } else if (res.statusCode >= 400) {
        logger.warn(logLine, 'http');
      } else if (res.statusCode < 300) {
        logger.info(logLine, 'http');
      }
    }
  });

  next();
});

(async () => {
  const puppeteerAutomation = new PuppeteerAutomation();
  
  // Initialize Puppeteer without blocking server startup
  puppeteerAutomation.initializeSession().catch(error => {
    logger.warn('Puppeteer initialization failed, automation features disabled', 'puppeteer', undefined, error);
  });

  // Health check endpoint (before other routes)
  app.get("/health", healthCheckHandler);
  app.get("/api/health", healthCheckHandler);
  app.head("/", (req, res) => res.status(200).end());
  app.head("/health", (req, res) => res.status(200).end());

  await registerRoutes(app);
  const { createServer } = await import('http');
  const server = createServer(app);

  // Setup frontend serving before error handlers
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    logger.info('Setting up static file serving for production', 'server');
    serveStatic(app);
  }

  // 404 handler for API routes only
  app.use('/api/*', (req, res) => {
    throw new AppError(`Route ${req.method} ${req.path} not found`, 404, 'routing');
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Use PORT environment variable for deployment platforms like Render
  // Fall back to 5000 for local development
  const port = parseInt(process.env.PORT || '5000', 10);

  // Import Socket.IO using ES module syntax
  const { Server } = await import('socket.io');
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Set up broadcast function for routes
  setBroadcastFunction((userId: number, message: any) => {
    io.to(`user_${userId}`).emit('message', message);
    logger.debug(`Message broadcasted to user ${userId}`, 'websocket', userId, { messageType: message.type });
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    logger.info('WebSocket connection established', 'websocket');

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined their room`, 'websocket', userId);

      // Send initial connection confirmation
      socket.emit('connected', { userId, timestamp: new Date() });

      // Send current session status
      checkAndSendSessionStatus(socket);
    });

    socket.on('disconnect', () => {
      logger.info('WebSocket connection closed', 'websocket');
    });

    socket.on('error', (error) => {
      logger.error('WebSocket error', 'websocket', undefined, error);
    });
  });

  // Function to check and send session status
  async function checkAndSendSessionStatus(socket: any) {
    try {
      if (puppeteerAutomation.isReady()) {
        const sessionData = await puppeteerAutomation.captureSessionData();
        socket.emit('session_status', sessionData);
        logger.debug('Session status sent', 'websocket');
      } else {
        socket.emit('session_status', {
          initialized: false,
          message: 'Automation service not available'
        });
      }
    } catch (error) {
      logger.error('Error checking session status', 'websocket', undefined, error);
      socket.emit('session_status', {
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  server.listen(port, "0.0.0.0", () => {
    logger.info(`Server started successfully on port ${port}`, 'server', undefined, {
      port,
      environment: process.env.NODE_ENV,
      host: "0.0.0.0"
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`, 'server');
    try {
      await puppeteerAutomation.cleanup();
      server.close(() => {
        logger.info('Server closed successfully', 'server');
        process.exit(0);
      });
      
      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('Forced shutdown after timeout', 'server');
        process.exit(1);
      }, 10000);
    } catch (error) {
      logger.error('Error during shutdown', 'server', undefined, error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', 'server', undefined, error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', 'server', undefined, reason, { promise });
    gracefulShutdown('UNHANDLED_REJECTION');
  });
})();
