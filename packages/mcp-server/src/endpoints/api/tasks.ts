/**
 * API endpoints for task management.
 *
 * GET    /api/tasks         — list all tasks (optionally filtered by status)
 * GET    /api/tasks/:id     — get a single task by ID
 * GET    /api/tasks/history — list completed/failed tasks history
 * PATCH  /api/tasks/:id     — update task status (start/complete/fail/reopen)
 * DELETE /api/tasks         — clear all tasks
 * DELETE /api/tasks/:id     — remove a specific task by ID
 */

import type { Request, Response } from "express";

import * as taskStore from "../../state/task-store.js";
import type { TaskStatus } from "../../types.js";

/** Handles GET /api/tasks — returns all tasks, optionally filtered by status. */
export async function handleGetTasks(
  req: Request,
  res: Response
): Promise<void> {
  const statusParam = req.query.status as string | undefined;

  if (statusParam) {
    const validStatuses: TaskStatus[] = [
      "pending",
      "ongoing",
      "completed",
      "failed",
    ];
    if (!validStatuses.includes(statusParam as TaskStatus)) {
      res.status(400).json({ error: `Invalid status: ${statusParam}` });
      return;
    }
    const tasks = taskStore.listByStatus(statusParam as TaskStatus);
    res.json({ tasks });
  } else {
    const tasks = taskStore.listAll();
    res.json({ tasks });
  }
}

/** Handles GET /api/tasks/:id — returns a single task by ID. */
export async function handleGetTask(
  req: Request,
  res: Response
): Promise<void> {
  const id = req.params.id as string;
  const task = taskStore.findById(id);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ task });
}

/** Handles GET /api/tasks/history — returns completed/failed tasks history. */
export async function handleGetHistory(
  _req: Request,
  res: Response
): Promise<void> {
  const history = taskStore.getHistory();
  res.json({ history });
}

/** Handles PATCH /api/tasks/:id — updates task status. */
export async function handlePatchTask(
  req: Request,
  res: Response
): Promise<void> {
  const id = req.params.id as string;
  const action = req.body?.action as string | undefined;

  if (!action) {
    res.status(400).json({ error: "Missing 'action' field" });
    return;
  }

  const task = taskStore.findById(id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  switch (action) {
    case "start": {
      if (task.status !== "pending") {
        res.status(400).json({
          error: `Cannot start task: current status is '${task.status}' (expected 'pending')`,
        });
        return;
      }
      const updated = taskStore.startTask(id);
      res.json({ ok: true, task: updated });
      break;
    }

    case "complete": {
      if (task.status !== "ongoing") {
        res.status(400).json({
          error: `Cannot complete task: current status is '${task.status}' (expected 'ongoing')`,
        });
        return;
      }
      const result = req.body?.result as string | undefined;
      const updated = taskStore.completeTask(id, result);
      res.json({ ok: true, task: updated });
      break;
    }

    case "fail": {
      if (task.status !== "ongoing") {
        res.status(400).json({
          error: `Cannot fail task: current status is '${task.status}' (expected 'ongoing')`,
        });
        return;
      }
      const reason = req.body?.reason as string | undefined;
      const updated = taskStore.failTask(id, reason);
      res.json({ ok: true, task: updated });
      break;
    }

    case "reopen": {
      if (task.status !== "completed" && task.status !== "failed") {
        res.status(400).json({
          error: `Cannot reopen task: current status is '${task.status}' (expected 'completed' or 'failed')`,
        });
        return;
      }
      const updated = taskStore.reopenTask(id);
      res.json({ ok: true, task: updated });
      break;
    }

    default:
      res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

/** Handles DELETE /api/tasks — clears all tasks. */
export async function handleClearTasks(
  _req: Request,
  res: Response
): Promise<void> {
  taskStore.clear();
  res.json({ ok: true });
}

/** Handles DELETE /api/tasks/:id — removes a specific task by ID. */
export async function handleDeleteTask(
  req: Request,
  res: Response
): Promise<void> {
  const id = req.params.id as string;
  const removed = taskStore.removeById(id);

  if (removed) {
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
}
