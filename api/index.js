const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { setupStandardAuth } = require('../server/standardAuth');
const { registerRoutes } = require('../server/routes');

// Initialize Express
const app = express();

// Basic configurations
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware for logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

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
      console.log(logLine);
    }
  });

  next();
});

// Initialize server
const server = createServer(app);

// Setup authentication (standardAuth for non-Replit environments)
setupStandardAuth(app);

// Register API routes
registerRoutes(app);

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("[Error]:", err);
  res.status(status).json({ message });
});

// For local development (not used in Vercel)
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export for Vercel
module.exports = app;