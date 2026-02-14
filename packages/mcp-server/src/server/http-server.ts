/**
 * HTTP server creation and request routing.
 *
 * Composes CORS middleware and delegates to endpoint handlers.
 */

import http from "node:http";

import { applyCorsHeaders } from "../middleware/cors.js";
import { handleTask } from "../endpoints/task.js";
import { handleHealth } from "../endpoints/health.js";
import { handleSseConnect, handleSseMessage } from "../endpoints/sse.js";
import { handleStatus } from "../endpoints/api/status.js";
import {
  handleGetTasks,
  handleGetHistory,
  handleClearTasks,
  handleDeleteTask,
} from "../endpoints/api/tasks.js";
import { handleEvents } from "../endpoints/api/events.js";
import { handleDashboard } from "../endpoints/dashboard/serve.js";

/** Creates the HTTP server with all routes wired up. */
export function createHttpServer(): http.Server {
  return http.createServer(async (req, res) => {
    // Apply CORS headers to every response
    applyCorsHeaders(req, res);

    // Preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /task — browser task submission
    if (req.method === "POST" && req.url === "/task") {
      await handleTask(req, res);
      return;
    }

    // GET /sse — establish SSE connection for MCP transport
    if (req.method === "GET" && req.url === "/sse") {
      await handleSseConnect(req, res);
      return;
    }

    // POST /messages?sessionId=xxx — relay MCP messages
    if (req.method === "POST" && req.url?.startsWith("/messages")) {
      await handleSseMessage(req, res);
      return;
    }

    // GET /health — health check
    if (req.method === "GET" && req.url === "/health") {
      await handleHealth(req, res);
      return;
    }

    // GET /api/status — server status
    if (req.method === "GET" && req.url === "/api/status") {
      await handleStatus(req, res);
      return;
    }

    // GET /api/tasks — list all pending tasks
    if (req.method === "GET" && req.url === "/api/tasks") {
      await handleGetTasks(req, res);
      return;
    }

    // GET /api/tasks/history — list completed tasks
    if (req.method === "GET" && req.url === "/api/tasks/history") {
      await handleGetHistory(req, res);
      return;
    }

    // DELETE /api/tasks — clear all pending tasks
    if (req.method === "DELETE" && req.url === "/api/tasks") {
      await handleClearTasks(req, res);
      return;
    }

    // DELETE /api/tasks/:id — delete specific task
    if (req.method === "DELETE" && req.url?.startsWith("/api/tasks/")) {
      const id = req.url.slice("/api/tasks/".length);
      if (id) {
        await handleDeleteTask(req, res, id);
        return;
      }
    }

    // GET /api/events — SSE stream for dashboard updates
    if (req.method === "GET" && req.url === "/api/events") {
      await handleEvents(req, res);
      return;
    }

    // GET /dashboard* — serve dashboard static files
    if (req.method === "GET" && req.url?.startsWith("/dashboard")) {
      await handleDashboard(req, res);
      return;
    }

    // Fallback — 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });
}
