import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, setBroadcastFunction } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { PuppeteerAutomation } from "./automation/puppeteer";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const puppeteerAutomation = new PuppeteerAutomation();
  
  // Initialize Puppeteer without blocking server startup
  puppeteerAutomation.initializeSession().catch(error => {
    console.log('Puppeteer initialization failed, automation features disabled:', error.message);
  });

  await registerRoutes(app);
  const { createServer } = await import('http');
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.

  const port = 5000;

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
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log('WebSocket connection established');

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);

      // Send initial connection confirmation
      socket.emit('connected', { userId, timestamp: new Date() });

      // Send current session status
      checkAndSendSessionStatus(socket);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Function to check and send session status
  async function checkAndSendSessionStatus(socket: any) {
    try {
      if (puppeteerAutomation.isReady()) {
        const sessionData = await puppeteerAutomation.captureSessionData();
        socket.emit('session_status', sessionData);
      } else {
        socket.emit('session_status', {
          initialized: false,
          message: 'Automation service not available'
        });
      }
    } catch (error) {
      console.error('Error checking session status:', error);
      socket.emit('session_status', {
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
