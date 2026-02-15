/**
 * Shared type definitions for the clens MCP server.
 */

/** Task status representing its lifecycle state. */
export type TaskStatus = "pending" | "ongoing" | "completed" | "failed";

/**
 * Component information extracted from framework-specific component trees.
 */
export interface ComponentInfo {
  /** Name of the component. e.g. "AppComponent", "MyComponent" */
  name: string;
  /** Source file path of the component. e.g. "src/app/app.component.ts" */
  file?: string;
  /** Line number of the component in the source file. e.g. 10 */
  line?: number;
  /** Relative DOM path from the component root to a selected child element. e.g. "div > ul > li:nth-of-type(2)" */
  childPath?: string;
  /** Semantic identifier for a specific element within the component. e.g. "button.submit", "input#email" */
  element?: string;
}

/** A task submitted from the browser overlay. */
export interface BrowserTask {
  id: string;
  text: string;
  status: TaskStatus;
  component?: ComponentInfo; // structured component context from the overlay
  timestamp: string; // when submitted
  startedAt?: string; // when marked ongoing
  completedAt?: string; // when completed or failed
  result?: string; // completion summary or failure reason
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
  | { type: "task_started"; task: BrowserTask }
  | { type: "task_completed"; task: BrowserTask }
  | { type: "task_failed"; task: BrowserTask }
  | { type: "task_deleted"; id: string }
  | { type: "queue_cleared" };
