/**
 * In-memory task store with lifecycle management.
 *
 * Browser-submitted tasks live in this store through their full lifecycle:
 * pending -> ongoing -> completed/failed.
 */

import { randomUUID } from "node:crypto";
import type { BrowserTask, DashboardEvent, TaskStatus } from "../types.js";

/** Task store using Map for efficient lookups. */
const store = new Map<string, BrowserTask>();

/** Callbacks registered by waiters blocked on the next pending task. */
const waiters: Array<() => void> = [];

/** Maximum number of completed/failed tasks to retain (bounded memory). */
const MAX_HISTORY_SIZE = 100;

/** Event listeners for dashboard real-time updates. */
const eventListeners: Array<(event: DashboardEvent) => void> = [];

/** Returns the current number of tasks in the store. */
export function size(): number {
  return store.size;
}

/**
 * Pushes a task onto the store with status "pending" and wakes any blocked waiters.
 */
export function enqueue(task: Omit<BrowserTask, "id" | "status">): BrowserTask {
  const fullTask: BrowserTask = {
    ...task,
    id: randomUUID(),
    status: "pending",
  };
  store.set(fullTask.id, fullTask);
  notifyWaiters();
  emitEvent({ type: "task_enqueued", task: fullTask });
  evictOldHistory();
  return fullTask;
}

/** Returns all tasks, optionally filtered by status. */
export function listByStatus(status?: TaskStatus): BrowserTask[] {
  const tasks = Array.from(store.values());
  if (status) {
    return tasks.filter((t) => t.status === status);
  }
  return tasks;
}

/** Returns all tasks without filtering. */
export function listAll(): BrowserTask[] {
  return Array.from(store.values());
}

/** Finds a task by ID. Returns undefined if not found. */
export function findById(id: string): BrowserTask | undefined {
  return store.get(id);
}

/** Peeks at the oldest pending task without removing it. Returns undefined if none. */
export function peek(): BrowserTask | undefined {
  const pending = listByStatus("pending");
  if (pending.length === 0) return undefined;
  // Return the oldest pending task (earliest timestamp)
  return pending.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )[0];
}

/**
 * Transitions a task from "pending" to "ongoing".
 * Returns the updated task, or undefined if not found or invalid state.
 */
export function startTask(id: string): BrowserTask | undefined {
  const task = store.get(id);
  if (!task) return undefined;
  if (task.status !== "pending") return undefined;

  const updatedTask: BrowserTask = {
    ...task,
    status: "ongoing",
    startedAt: new Date().toISOString(),
  };
  store.set(id, updatedTask);
  emitEvent({ type: "task_started", task: updatedTask });
  return updatedTask;
}

/**
 * Transitions a task from "ongoing" to "completed".
 * Returns the updated task, or undefined if not found or invalid state.
 */
export function completeTask(
  id: string,
  result?: string
): BrowserTask | undefined {
  const task = store.get(id);
  if (!task) return undefined;
  if (task.status !== "ongoing") return undefined;

  const updatedTask: BrowserTask = {
    ...task,
    status: "completed",
    completedAt: new Date().toISOString(),
    result,
  };
  store.set(id, updatedTask);
  emitEvent({ type: "task_completed", task: updatedTask });
  evictOldHistory();
  return updatedTask;
}

/**
 * Transitions a task from "ongoing" to "failed".
 * Returns the updated task, or undefined if not found or invalid state.
 */
export function failTask(id: string, reason?: string): BrowserTask | undefined {
  const task = store.get(id);
  if (!task) return undefined;
  if (task.status !== "ongoing") return undefined;

  const updatedTask: BrowserTask = {
    ...task,
    status: "failed",
    completedAt: new Date().toISOString(),
    result: reason,
  };
  store.set(id, updatedTask);
  emitEvent({ type: "task_failed", task: updatedTask });
  evictOldHistory();
  return updatedTask;
}

/**
 * Transitions a task from "completed" or "failed" back to "pending".
 * Clears lifecycle fields and wakes any blocked waiters.
 * Returns the updated task, or undefined if not found or invalid state.
 */
export function reopenTask(id: string): BrowserTask | undefined {
  const task = store.get(id);
  if (!task) return undefined;
  if (task.status !== "completed" && task.status !== "failed") return undefined;

  const updatedTask: BrowserTask = {
    ...task,
    status: "pending",
    startedAt: undefined,
    completedAt: undefined,
    result: undefined,
  };
  store.set(id, updatedTask);
  notifyWaiters();
  emitEvent({ type: "task_enqueued", task: updatedTask });
  return updatedTask;
}

/** Removes a specific task from the store by its ID. Returns true if found and removed. */
export function removeById(id: string): boolean {
  const existed = store.has(id);
  if (existed) {
    store.delete(id);
    emitEvent({ type: "task_deleted", id });
  }
  return existed;
}

/** Clears all tasks from the store. */
export function clear(): void {
  store.clear();
  emitEvent({ type: "queue_cleared" });
}

/** Returns tasks in terminal states (completed or failed), most recent first. */
export function getHistory(): BrowserTask[] {
  return listByStatus("completed")
    .concat(listByStatus("failed"))
    .sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime()
    );
}

/**
 * Returns a promise that resolves to true when a pending task is
 * available, or false if the timeout expires first.
 */
export function waitForTask(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const pending = listByStatus("pending");
    if (pending.length > 0) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => {
      const idx = waiters.indexOf(onTask);
      if (idx !== -1) waiters.splice(idx, 1);
      resolve(false);
    }, timeoutMs);

    function onTask() {
      clearTimeout(timer);
      resolve(true);
    }

    waiters.push(onTask);
  });
}

/** Subscribes to dashboard events. Returns an unsubscribe function. */
export function subscribe(
  listener: (event: DashboardEvent) => void
): () => void {
  eventListeners.push(listener);
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx !== -1) eventListeners.splice(idx, 1);
  };
}

/** Notifies all registered waiters that a new pending task is available. */
function notifyWaiters(): void {
  while (waiters.length > 0) {
    const resolve = waiters.shift()!;
    resolve();
  }
}

/** Emits a dashboard event to all subscribers. */
function emitEvent(event: DashboardEvent): void {
  eventListeners.forEach((listener) => listener(event));
}

/**
 * Evicts oldest completed/failed tasks if history exceeds MAX_HISTORY_SIZE.
 * Keeps the store bounded to prevent unbounded memory growth.
 */
function evictOldHistory(): void {
  const history = getHistory();
  if (history.length <= MAX_HISTORY_SIZE) return;

  const toEvict = history.slice(MAX_HISTORY_SIZE);
  toEvict.forEach((task) => store.delete(task.id));
}
