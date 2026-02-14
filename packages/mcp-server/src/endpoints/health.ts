/**
 * GET /health — simple health-check endpoint.
 */

import http from "node:http";

import { AUTH_TOKEN } from "../lib/config.js";
import { isAuthorized } from "../middleware/auth.js";
import * as taskQueue from "../state/task-queue.js";

/** Handles GET /health requests. */
export async function handleHealth(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      pending: taskQueue.size(),
      authenticated: !!AUTH_TOKEN,
    })
  );
}
