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

    // Fallback — 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });
}
