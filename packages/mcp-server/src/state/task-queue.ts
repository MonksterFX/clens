/**
 * In-memory task queue with a waiter mechanism.
 *
 * Browser-submitted tasks are pushed here and consumed
 * by the MCP tool (WaitTaskFromBrowser).
 */

import { randomUUID } from "node:crypto";
import type { BrowserTask, CompletedTask, DashboardEvent } from "../types.js";

/** Queued tasks awaiting consumption. */
const queue: BrowserTask[] = [];

/** Callbacks registered by waiters blocked on the next task. */
const waiters: Array<() => void> = [];

/** Bounded history of completed tasks (ring buffer, max 50). */
const HISTORY_MAX_SIZE = 50;
const history: CompletedTask[] = [];

/** Event listeners for dashboard real-time updates. */
const eventListeners: Array<(event: DashboardEvent) => void> = [];

/** Returns the current number of queued tasks. */
export function size(): number {
  return queue.length;
}

/** Pushes a task onto the queue and wakes any blocked waiters. */
export function enqueue(task: Omit<BrowserTask, "id">): BrowserTask {
  const fullTask: BrowserTask = {
    ...task,
    id: randomUUID(),
  };
  queue.push(fullTask);
  notifyWaiters();
  emitEvent({ type: "task_enqueued", task: fullTask });
  return fullTask;
}

/** Returns all pending tasks without removing them. */
export function listAll(): BrowserTask[] {
  return [...queue];
}

/** Peeks at the next task without removing it. Returns `undefined` if empty. */
export function peek(): BrowserTask | undefined {
  return queue[0];
}

/** Removes and returns the next task. Returns `undefined` if empty. */
export function dequeue(): BrowserTask | undefined {
  const task = queue.shift();
  if (task) {
    addToHistory(task);
    emitEvent({ type: "task_dequeued", task });
  }
  return task;
}

/** Removes a specific task from the queue by its ID. Returns true if found and removed. */
export function removeById(id: string): boolean {
  const idx = queue.findIndex((t) => t.id === id);
  if (idx !== -1) {
    const [task] = queue.splice(idx, 1);
    emitEvent({ type: "task_deleted", id: task.id });
    return true;
  }
  return false;
}

/** Clears all pending tasks from the queue. */
export function clear(): void {
  queue.length = 0;
  emitEvent({ type: "queue_cleared" });
}

/** Returns the history of completed tasks (most recent first). */
export function getHistory(): CompletedTask[] {
  return [...history].reverse();
}

/**
 * Returns a promise that resolves to `true` when a task is
 * enqueued, or `false` if the timeout expires first.
 */
export function waitForTask(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (queue.length > 0) {
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

/** Adds a task to the history ring buffer. */
function addToHistory(task: BrowserTask): void {
  const completedTask: CompletedTask = {
    ...task,
    completedAt: new Date().toISOString(),
  };
  history.push(completedTask);
  if (history.length > HISTORY_MAX_SIZE) {
    history.shift();
  }
}

/** Notifies all registered waiters that a new task is available. */
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
