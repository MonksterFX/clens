/**
 * POST /task — accepts a new task submission from the browser overlay.
 */

import type { Request, Response } from "express";

import * as taskQueue from "../state/task-queue.js";

/** Handles POST /task requests. Body is pre-parsed by express.json(). */
export async function handleTask(req: Request, res: Response): Promise<void> {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

  if (!text) {
    res.status(400).json({ error: "Missing 'text' field" });
    return;
  }

  const task = taskQueue.enqueue({
    text,
    timestamp: new Date().toISOString(),
  });

  res.json({ ok: true, queued: taskQueue.size(), id: task.id });
}
