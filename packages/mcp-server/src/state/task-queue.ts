/**
 * In-memory task queue with a waiter mechanism.
 *
 * Browser-submitted tasks are pushed here and consumed
 * by the MCP tool (WaitTaskFromBrowser).
 */

import type { BrowserTask } from "../types.js";

/** Queued tasks awaiting consumption. */
const queue: BrowserTask[] = [];

/** Callbacks registered by waiters blocked on the next task. */
const waiters: Array<() => void> = [];

/** Returns the current number of queued tasks. */
export function size(): number {
  return queue.length;
}

/** Pushes a task onto the queue and wakes any blocked waiters. */
export function enqueue(task: BrowserTask): void {
  queue.push(task);
  notifyWaiters();
}

/** Peeks at the next task without removing it. Returns `undefined` if empty. */
export function peek(): BrowserTask | undefined {
  return queue[0];
}

/** Removes and returns the next task. Returns `undefined` if empty. */
export function dequeue(): BrowserTask | undefined {
  return queue.shift();
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

/** Notifies all registered waiters that a new task is available. */
function notifyWaiters(): void {
  while (waiters.length > 0) {
    const resolve = waiters.shift()!;
    resolve();
  }
}
