/**
 * API client functions for communicating with the MCP server.
 */

/** Get the API base URL (defaults to current origin in production). */
function getApiBase(): string {
  if (import.meta.env.DEV) {
    return "http://localhost:3100";
  }
  return window.location.origin;
}

/** Common fetch wrapper with auth header. */
async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getApiBase()}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });
}

/** Server status response type. */
export interface ServerStatus {
  uptime: number;
  transport: string;
  port: number;
  queueSize: number;
  activeSseSessions: number;
}

/** Task type. */
export interface Task {
  id: string;
  text: string;
  timestamp: string;
}

/** Completed task type. */
export interface CompletedTask extends Task {
  completedAt: string;
}

/** Dashboard event types. */
export type DashboardEvent =
  | { type: "connected" }
  | { type: "task_enqueued"; task: Task }
  | { type: "task_dequeued"; task: Task }
  | { type: "task_deleted"; id: string }
  | { type: "queue_cleared" };

/** Fetches server status. */
export async function getStatus(): Promise<ServerStatus> {
  const res = await fetchApi("/api/status");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Fetches all pending tasks. */
export async function getTasks(): Promise<Task[]> {
  const res = await fetchApi("/api/tasks");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.tasks;
}

/** Fetches task history. */
export async function getHistory(): Promise<CompletedTask[]> {
  const res = await fetchApi("/api/tasks/history");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.history;
}

/** Clears all pending tasks. */
export async function clearTasks(): Promise<void> {
  const res = await fetchApi("/api/tasks", { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Deletes a specific task by ID. */
export async function deleteTask(id: string): Promise<void> {
  const res = await fetchApi(`/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Subscribes to real-time events via SSE. */
export function subscribeToEvents(
  onEvent: (event: DashboardEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const url = `${getApiBase()}/api/events`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as DashboardEvent;
      onEvent(event);
    } catch (err) {
      console.error("Failed to parse SSE event:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE error:", err);
    if (onError) {
      onError(new Error("SSE connection failed"));
    }
  };

  return () => eventSource.close();
}
