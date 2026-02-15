/**
 * POST /task — accepts a new task submission from the browser overlay.
 */

import type { Request, Response } from "express";

import * as taskStore from "../state/task-store.js";
import type { ComponentInfo } from "../types.js";

/** Handles POST /task requests. Body is pre-parsed by express.json(). */
export async function handleTask(req: Request, res: Response): Promise<void> {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

  if (!text) {
    res.status(400).json({ error: "Missing 'text' field" });
    return;
  }

  // Parse optional component field
  let component: ComponentInfo | undefined;
  if (req.body.component && typeof req.body.component === "object") {
    const c = req.body.component;
    component = {
      name: typeof c.name === "string" ? c.name : "",
      file: typeof c.file === "string" ? c.file : undefined,
      line: typeof c.line === "number" ? c.line : undefined,
      childPath: typeof c.childPath === "string" ? c.childPath : undefined,
      element: typeof c.element === "string" ? c.element : undefined,
    };
  }

  const task = taskStore.enqueue({
    text,
    component,
    timestamp: new Date().toISOString(),
  });

  res.json({ ok: true, queued: taskStore.size(), id: task.id });
}
