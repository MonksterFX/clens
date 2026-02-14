/**
 * GET /api/events — SSE endpoint for real-time dashboard updates.
 */

import http from "node:http";

import { isAuthorized } from "../../middleware/auth.js";
import * as taskQueue from "../../state/task-queue.js";
import { setActiveSseSessions } from "./status.js";

/** Active SSE connections. */
const connections = new Set<http.ServerResponse>();

/** Handles GET /api/events — establishes an SSE connection for dashboard updates. */
export async function handleEvents(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Add to active connections
  connections.add(res);
  setActiveSseSessions(connections.size);

  // Subscribe to task queue events
  const unsubscribe = taskQueue.subscribe((event) => {
    if (connections.has(res)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });

  // Clean up on close
  req.on("close", () => {
    connections.delete(res);
    setActiveSseSessions(connections.size);
    unsubscribe();
  });
}
