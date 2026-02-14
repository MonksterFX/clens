/**
 * GET /api/status — returns server status for the dashboard.
 */

import http from "node:http";

import { isAuthorized } from "../../middleware/auth.js";
import { PORT } from "../../lib/config.js";
import * as taskQueue from "../../state/task-queue.js";
import type { ServerStatus } from "../../types.js";

/** Server start time for uptime calculation. */
const startTime = Date.now();

/** Count of active SSE sessions (updated externally). */
let activeSseSessions = 0;

/** Updates the count of active SSE sessions. */
export function setActiveSseSessions(count: number): void {
  activeSseSessions = count;
}

/** Handles GET /api/status requests. */
export async function handleStatus(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const status: ServerStatus = {
    uptime: Date.now() - startTime,
    transport: process.env.MCP_TRANSPORT || "stdio",
    port: PORT,
    queueSize: taskQueue.size(),
    activeSseSessions,
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(status));
}
