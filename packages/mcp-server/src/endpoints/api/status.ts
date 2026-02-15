/**
 * GET /api/status — returns server status for the dashboard.
 */

import type { Request, Response } from "express";

import { PORT } from "../../lib/config.js";
import * as taskStore from "../../state/task-store.js";
import * as sseConnections from "../../state/sse-connections.js";
import type { ServerStatus } from "../../types.js";

/** Server start time for uptime calculation. */
const startTime = Date.now();

/** Handles GET /api/status requests. */
export async function handleStatus(
  _req: Request,
  res: Response
): Promise<void> {
  const status: ServerStatus = {
    uptime: Date.now() - startTime,
    transport: process.env.MCP_TRANSPORT || "stdio",
    port: PORT,
    queueSize: taskStore.size(),
    activeSseSessions: sseConnections.getConnectionCount(),
  };

  res.json(status);
}
