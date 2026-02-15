/**
 * HTTP server creation with Express routing and middleware.
 *
 * All routes are defined in a single location for easy discoverability.
 * Auth is handled by middleware so individual handlers stay focused.
 */

import http from "node:http";
import express from "express";
import type { Request, Response, NextFunction } from "express";

import { corsMiddleware } from "../middleware/cors.js";
import { requireAuth } from "../middleware/auth.js";
import { requestLogger } from "../middleware/logger.js";
import { handleTask } from "../endpoints/task.js";
import { handleHealth } from "../endpoints/health.js";
import { handleSseConnect, handleSseMessage } from "../endpoints/sse.js";
import { handleStatus } from "../endpoints/api/status.js";
import {
  handleGetTasks,
  handleGetTask,
  handleGetHistory,
  handlePatchTask,
  handleClearTasks,
  handleDeleteTask,
} from "../endpoints/api/tasks.js";
import { handleEvents } from "../endpoints/api/events.js";
import { createDashboardRouter } from "../endpoints/dashboard/serve.js";

/** Creates the HTTP server with all routes wired up via Express. */
export function createHttpServer(): http.Server {
  const app = express();

  // ── Global middleware ──────────────────────────────────────────────
  app.use(requestLogger);
  app.use(corsMiddleware);

  // ── JSON body parser (1 MB limit, only for routes that need it) ──
  const jsonParser = express.json({ limit: "1mb" });

  // ── Task submission (browser overlay → server) ─────────────────────
  app.post("/task", jsonParser, requireAuth, handleTask);

  // ── MCP SSE transport (no auth, no body parsing — SDK handles it) ──
  app.get("/sse", handleSseConnect);
  app.post("/messages", handleSseMessage);

  // ── Health check ───────────────────────────────────────────────────
  app.get("/health", requireAuth, handleHealth);

  // ── API routes (all require auth) ──────────────────────────────────
  const api = express.Router();
  api.use(requireAuth);
  api.use(jsonParser); // API routes need JSON parsing for PATCH
  api.get("/status", handleStatus);
  api.get("/tasks/history", handleGetHistory);
  api.get("/tasks/:id", handleGetTask);
  api.get("/tasks", handleGetTasks);
  api.patch("/tasks/:id", handlePatchTask);
  api.delete("/tasks/:id", handleDeleteTask);
  api.delete("/tasks", handleClearTasks);
  api.get("/events", handleEvents);
  app.use("/api", api);

  // ── Dashboard static files ─────────────────────────────────────────
  app.use("/dashboard", createDashboardRouter());

  // ── 404 fallback ───────────────────────────────────────────────────
  app.use((_req: Request, res: Response, _next: NextFunction) => {
    res.status(404).json({ error: "Not found" });
  });

  // ── Global error handler ───────────────────────────────────────────
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal server error";
    res.status(status).json({ error: message });
  });

  return http.createServer(app);
}

/**
 * Registers graceful shutdown handlers for SIGTERM and SIGINT.
 * Gives in-flight requests 10 seconds to complete before forcing exit.
 */
export function registerShutdownHandlers(server: http.Server): void {
  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.error(
      `\n[clens-mcp] Received ${signal}, shutting down gracefully...`
    );

    // Stop accepting new connections
    server.close(() => {
      console.error("[clens-mcp] HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10 seconds if in-flight requests don't finish
    setTimeout(() => {
      console.error("[clens-mcp] Forcing shutdown after timeout");
      process.exit(0);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
