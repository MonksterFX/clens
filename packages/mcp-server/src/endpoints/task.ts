/**
 * POST /task — accepts a new task submission from the browser overlay.
 */

import http from "node:http";

import { readBody } from "../lib/http.js";
import { isAuthorized } from "../middleware/auth.js";
import * as taskQueue from "../state/task-queue.js";
import type { BrowserTask } from "../types.js";

/** Handles POST /task requests. */
export async function handleTask(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  try {
    const body = JSON.parse(await readBody(req));
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing 'text' field" }));
      return;
    }

    const task: BrowserTask = { text, timestamp: new Date().toISOString() };
    taskQueue.enqueue(task);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, queued: taskQueue.size() }));
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
  }
}
