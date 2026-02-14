/**
 * API endpoints for task management.
 *
 * GET    /api/tasks         — list all pending tasks
 * GET    /api/tasks/history — list completed tasks history
 * DELETE /api/tasks         — clear all pending tasks
 * DELETE /api/tasks/:id     — remove a specific task by ID
 */

import http from "node:http";

import { isAuthorized } from "../../middleware/auth.js";
import * as taskQueue from "../../state/task-queue.js";

/** Handles GET /api/tasks — returns all pending tasks. */
export async function handleGetTasks(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const tasks = taskQueue.listAll();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ tasks }));
}

/** Handles GET /api/tasks/history — returns completed tasks history. */
export async function handleGetHistory(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const history = taskQueue.getHistory();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ history }));
}

/** Handles DELETE /api/tasks — clears all pending tasks. */
export async function handleClearTasks(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  taskQueue.clear();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
}

/** Handles DELETE /api/tasks/:id — removes a specific task by ID. */
export async function handleDeleteTask(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  id: string
): Promise<void> {
  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const removed = taskQueue.removeById(id);
  if (removed) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Task not found" }));
  }
}
