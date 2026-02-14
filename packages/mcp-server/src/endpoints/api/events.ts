/**
 * GET /api/events — SSE endpoint for real-time dashboard updates.
 */

import type { Request, Response } from "express";

import * as taskQueue from "../../state/task-queue.js";
import * as sseConnections from "../../state/sse-connections.js";

/** Handles GET /api/events — establishes an SSE connection for dashboard updates. */
export async function handleEvents(
  req: Request,
  res: Response
): Promise<void> {
  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Register with centralized SSE connection tracker
  sseConnections.addConnection(res);

  // Subscribe to task queue events and broadcast to this connection
  const unsubscribe = taskQueue.subscribe((event) => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });

  // Clean up on client disconnect
  req.on("close", () => {
    sseConnections.removeConnection(res);
    unsubscribe();
  });
}
