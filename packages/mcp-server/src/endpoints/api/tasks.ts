/**
 * API endpoints for task management.
 *
 * GET    /api/tasks         — list all pending tasks
 * GET    /api/tasks/history — list completed tasks history
 * DELETE /api/tasks         — clear all pending tasks
 * DELETE /api/tasks/:id     — remove a specific task by ID
 */

import type { Request, Response } from "express";

import * as taskQueue from "../../state/task-queue.js";

/** Handles GET /api/tasks — returns all pending tasks. */
export async function handleGetTasks(
  _req: Request,
  res: Response
): Promise<void> {
  const tasks = taskQueue.listAll();
  res.json({ tasks });
}

/** Handles GET /api/tasks/history — returns completed tasks history. */
export async function handleGetHistory(
  _req: Request,
  res: Response
): Promise<void> {
  const history = taskQueue.getHistory();
  res.json({ history });
}

/** Handles DELETE /api/tasks — clears all pending tasks. */
export async function handleClearTasks(
  _req: Request,
  res: Response
): Promise<void> {
  taskQueue.clear();
  res.json({ ok: true });
}

/** Handles DELETE /api/tasks/:id — removes a specific task by ID. */
export async function handleDeleteTask(
  req: Request,
  res: Response
): Promise<void> {
  const id = req.params.id as string;
  const removed = taskQueue.removeById(id);

  if (removed) {
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
}
