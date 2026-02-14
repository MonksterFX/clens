import { describe, it, expect, beforeEach } from "vitest";
import {
  size,
  enqueue,
  dequeue,
  peek,
  listAll,
  removeById,
  clear,
  getHistory,
  waitForTask,
  subscribe,
} from "./task-queue";

describe("task-queue", () => {
  beforeEach(() => {
    clear();
  });

  /** Verifies the queue starts empty. */
  it("should start empty", () => {
    expect(size()).toBe(0);
    expect(peek()).toBeUndefined();
    expect(listAll()).toEqual([]);
  });

  /** Verifies enqueue adds a task and assigns an id. */
  it("should enqueue a task with generated id", () => {
    const task = enqueue({ text: "hello", timestamp: "2025-01-01T00:00:00Z" });
    expect(task.id).toBeDefined();
    expect(task.text).toBe("hello");
    expect(size()).toBe(1);
  });

  /** Verifies peek returns the front task without removing it. */
  it("should peek without removing", () => {
    enqueue({ text: "first", timestamp: "2025-01-01T00:00:00Z" });
    const peeked = peek();
    expect(peeked?.text).toBe("first");
    expect(size()).toBe(1);
  });

  /** Verifies dequeue removes and returns the front task (FIFO). */
  it("should dequeue in FIFO order", () => {
    enqueue({ text: "first", timestamp: "2025-01-01T00:00:00Z" });
    enqueue({ text: "second", timestamp: "2025-01-01T00:00:01Z" });
    const task = dequeue();
    expect(task?.text).toBe("first");
    expect(size()).toBe(1);
  });

  /** Verifies dequeue returns undefined when queue is empty. */
  it("should return undefined from empty dequeue", () => {
    expect(dequeue()).toBeUndefined();
  });

  /** Verifies removeById removes a specific task. */
  it("should remove a task by id", () => {
    const task = enqueue({
      text: "remove me",
      timestamp: "2025-01-01T00:00:00Z",
    });
    expect(removeById(task.id)).toBe(true);
    expect(size()).toBe(0);
  });

  /** Verifies removeById returns false for missing ids. */
  it("should return false for unknown id", () => {
    expect(removeById("nonexistent")).toBe(false);
  });

  /** Verifies clear empties the queue. */
  it("should clear all tasks", () => {
    enqueue({ text: "a", timestamp: "2025-01-01T00:00:00Z" });
    enqueue({ text: "b", timestamp: "2025-01-01T00:00:01Z" });
    clear();
    expect(size()).toBe(0);
  });

  /** Verifies dequeued tasks appear in history (most recent first). */
  it("should track dequeued tasks in history", () => {
    const histBefore = getHistory().length;
    enqueue({ text: "done", timestamp: "2025-01-01T00:00:00Z" });
    dequeue();
    const hist = getHistory();
    expect(hist.length).toBe(histBefore + 1);
    expect(hist[0].text).toBe("done");
    expect(hist[0].completedAt).toBeDefined();
  });

  /** Verifies listAll returns copies of current tasks. */
  it("should list all pending tasks", () => {
    enqueue({ text: "a", timestamp: "2025-01-01T00:00:00Z" });
    enqueue({ text: "b", timestamp: "2025-01-01T00:00:01Z" });
    const all = listAll();
    expect(all).toHaveLength(2);
    expect(all[0].text).toBe("a");
    expect(all[1].text).toBe("b");
  });

  /** Verifies subscribe emits events on enqueue. */
  it("should emit events to subscribers", () => {
    const events: string[] = [];
    const unsub = subscribe((event) => {
      events.push(event.type);
    });
    enqueue({ text: "test", timestamp: "2025-01-01T00:00:00Z" });
    dequeue();
    unsub();
    expect(events).toContain("task_enqueued");
    expect(events).toContain("task_dequeued");
  });

  /** Verifies waitForTask resolves immediately when queue is non-empty. */
  it("should resolve waitForTask immediately when queue has items", async () => {
    enqueue({ text: "ready", timestamp: "2025-01-01T00:00:00Z" });
    const result = await waitForTask(100);
    expect(result).toBe(true);
  });

  /** Verifies waitForTask times out when queue stays empty. */
  it("should timeout waitForTask when queue is empty", async () => {
    const result = await waitForTask(50);
    expect(result).toBe(false);
  });

  /** Verifies waitForTask resolves when a task is enqueued during the wait. */
  it("should resolve waitForTask when task arrives during wait", async () => {
    const promise = waitForTask(1000);
    setTimeout(() => {
      enqueue({ text: "delayed", timestamp: "2025-01-01T00:00:00Z" });
    }, 20);
    const result = await promise;
    expect(result).toBe(true);
  });
});
