/**
 * Hook for subscribing to real-time task events via SSE.
 */

import { useEffect, useState } from "react";
import {
  subscribeToEvents,
  getTasks,
  getHistory,
  type Task,
  type CompletedTask,
  type DashboardEvent,
} from "../lib/api";

interface TaskEventState {
  tasks: Task[];
  history: CompletedTask[];
  connected: boolean;
}

/**
 * Subscribes to real-time task events and maintains local state.
 */
export function useTaskEvents(): TaskEventState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<CompletedTask[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    async function init() {
      try {
        const [taskData, historyData] = await Promise.all([
          getTasks(),
          getHistory(),
        ]);
        if (mounted) {
          setTasks(taskData);
          setHistory(historyData);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    }

    init();

    // Subscribe to events
    const unsubscribe = subscribeToEvents(
      (event: DashboardEvent) => {
        if (!mounted) return;

        switch (event.type) {
          case "connected":
            setConnected(true);
            break;

          case "task_enqueued":
            setTasks((prev) => [...prev, event.task]);
            break;

          case "task_dequeued":
            setTasks((prev) => prev.filter((t) => t.id !== event.task.id));
            setHistory((prev) => [
              { ...event.task, completedAt: new Date().toISOString() },
              ...prev,
            ]);
            break;

          case "task_deleted":
            setTasks((prev) => prev.filter((t) => t.id !== event.id));
            break;

          case "queue_cleared":
            setTasks([]);
            break;
        }
      },
      (err) => {
        console.error("SSE error:", err);
        setConnected(false);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { tasks, history, connected };
}
