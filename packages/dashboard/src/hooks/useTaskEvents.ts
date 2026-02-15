/**
 * Hook for subscribing to real-time task events via SSE.
 */

import { useEffect, useState } from "react";
import {
  subscribeToEvents,
  getTasks,
  getHistory,
  type Task,
  type DashboardEvent,
} from "../lib/api";

interface TaskEventState {
  tasks: Task[];
  connected: boolean;
}

/**
 * Subscribes to real-time task events and maintains local state.
 * All tasks are stored in a single list regardless of status.
 */
export function useTaskEvents(): TaskEventState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initial fetch - load all tasks and history into one list
    async function init() {
      try {
        const [currentTasks, historyTasks] = await Promise.all([
          getTasks(),
          getHistory(),
        ]);
        if (mounted) {
          // Combine current and history, removing duplicates
          const allTasks = [...currentTasks];
          historyTasks.forEach((histTask) => {
            if (!allTasks.find((t) => t.id === histTask.id)) {
              allTasks.push(histTask);
            }
          });
          setTasks(allTasks);
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
            // Upsert: update if task already exists (e.g. reopened), otherwise add
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === event.task.id);
              if (exists) {
                return prev.map((t) =>
                  t.id === event.task.id ? event.task : t
                );
              }
              return [...prev, event.task];
            });
            break;

          case "task_started":
          case "task_completed":
          case "task_failed":
            // Update task in place
            setTasks((prev) =>
              prev.map((t) => (t.id === event.task.id ? event.task : t))
            );
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

  return { tasks, connected };
}
