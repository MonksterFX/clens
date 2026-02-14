/**
 * Shared type definitions for the clens MCP server.
 */

/** A task submitted from the browser overlay. */
export interface BrowserTask {
  id: string;
  text: string;
  timestamp: string;
}

/** A task that has been dequeued/completed. */
export interface CompletedTask extends BrowserTask {
  completedAt: string;
}

/** Server status information for the dashboard. */
export interface ServerStatus {
  uptime: number;
  transport: string;
  port: number;
  queueSize: number;
  activeSseSessions: number;
}

/** Real-time event types streamed to the dashboard. */
export type DashboardEvent =
  | { type: "task_enqueued"; task: BrowserTask }
  | { type: "task_dequeued"; task: BrowserTask }
  | { type: "task_deleted"; id: string }
  | { type: "queue_cleared" };
