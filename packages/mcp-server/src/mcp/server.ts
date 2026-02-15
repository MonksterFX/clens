/**
 * MCP server factory and tool registration.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { DEFAULT_WAIT_TIMEOUT_SECS } from "../lib/config.js";
import * as taskStore from "../state/task-store.js";
import type { BrowserTask } from "../types.js";

/** Creates a new McpServer instance with all tools registered. */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "clens-mcp",
    version: "0.1.0",
  });

  registerTools(server);
  return server;
}

/** Registers all MCP tools on the given server instance. */
function registerTools(server: McpServer): void {
  // Tool 1: WaitForTask - blocks until a pending task is available
  server.registerTool(
    "WaitForTask",
    {
      title: "Wait For Task",
      description:
        "Blocks until a pending task is submitted from the browser overlay. " +
        "Does not change task status - use StartTask to mark it as ongoing.",
      inputSchema: {
        timeout: z
          .number()
          .optional()
          .describe("Maximum seconds to wait. Defaults to 30."),
      },
    },
    async ({ timeout }) => {
      const timeoutSecs = timeout ?? DEFAULT_WAIT_TIMEOUT_SECS;

      // Block until a pending task arrives or timeout expires
      const arrived = await taskStore.waitForTask(timeoutSecs * 1000);

      if (!arrived) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No task arrived within ${timeoutSecs}s. Call again to keep waiting.`,
            },
          ],
        };
      }

      const task = taskStore.peek();
      if (!task) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No pending tasks available.",
            },
          ],
        };
      }

      const pendingCount = taskStore.listByStatus("pending").length;
      return {
        content: [
          {
            type: "text" as const,
            text: formatTaskInfo(
              task,
              `Pending tasks in queue: ${pendingCount}`
            ),
          },
        ],
      };
    }
  );

  // Tool 2: ListTasks - list all tasks, optionally filtered by status
  server.registerTool(
    "ListTasks",
    {
      title: "List Tasks",
      description: "Lists all tasks, optionally filtered by status.",
      inputSchema: {
        status: z
          .enum(["pending", "ongoing", "completed", "failed"])
          .optional()
          .describe("Filter tasks by status. If omitted, returns all tasks."),
      },
    },
    async ({ status }) => {
      const tasks = status
        ? taskStore.listByStatus(status)
        : taskStore.listAll();

      if (tasks.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No tasks found.",
            },
          ],
        };
      }

      const lines = [
        `${tasks.length} task${tasks.length === 1 ? "" : "s"} found:\n`,
      ];
      tasks.forEach((task) => {
        lines.push(formatTaskListItem(task));
        lines.push("");
      });

      return {
        content: [
          {
            type: "text" as const,
            text: lines.join("\n"),
          },
        ],
      };
    }
  );

  // Tool 3: GetTask - get a single task by ID
  server.registerTool(
    "GetTask",
    {
      title: "Get Task",
      description: "Returns details of a single task by ID.",
      inputSchema: {
        id: z.string().describe("Task ID"),
      },
    },
    async ({ id }) => {
      const task = taskStore.findById(id);

      if (!task) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Task not found: ${id}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: formatTaskDetails(task),
          },
        ],
      };
    }
  );

  // Tool 4: StartTask - mark a pending task as ongoing
  server.registerTool(
    "StartTask",
    {
      title: "Start Task",
      description:
        'Marks a pending task as ongoing. Transitions status from "pending" to "ongoing".',
      inputSchema: {
        id: z.string().describe("Task ID"),
      },
    },
    async ({ id }) => {
      const task = taskStore.findById(id);

      if (!task) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Task not found: ${id}`,
            },
          ],
          isError: true,
        };
      }

      if (task.status !== "pending") {
        return {
          content: [
            {
              type: "text" as const,
              text: `Cannot start task ${id}: current status is '${task.status}' (expected 'pending').`,
            },
          ],
          isError: true,
        };
      }

      const updated = taskStore.startTask(id);
      if (!updated) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to start task ${id}.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Task ${id} is now ongoing.\n`,
              `  Text:       ${updated.text}`,
              `  Started at: ${updated.startedAt}`,
            ].join("\n"),
          },
        ],
      };
    }
  );

  // Tool 5: CompleteTask - mark an ongoing task as completed
  server.registerTool(
    "CompleteTask",
    {
      title: "Complete Task",
      description:
        'Marks an ongoing task as completed. Transitions status from "ongoing" to "completed".',
      inputSchema: {
        id: z.string().describe("Task ID"),
        result: z
          .string()
          .optional()
          .describe("Optional summary of what was done"),
      },
    },
    async ({ id, result }) => {
      const task = taskStore.findById(id);

      if (!task) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Task not found: ${id}`,
            },
          ],
          isError: true,
        };
      }

      if (task.status !== "ongoing") {
        return {
          content: [
            {
              type: "text" as const,
              text: `Cannot complete task ${id}: current status is '${task.status}' (expected 'ongoing').`,
            },
          ],
          isError: true,
        };
      }

      const updated = taskStore.completeTask(id, result);
      if (!updated) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to complete task ${id}.`,
            },
          ],
          isError: true,
        };
      }

      const duration = calculateDuration(
        updated.startedAt,
        updated.completedAt
      );
      const lines = [
        `Task ${id} completed.\n`,
        `  Text:         ${updated.text}`,
      ];
      if (updated.result) {
        lines.push(`  Result:       ${updated.result}`);
      }
      lines.push(`  Completed at: ${updated.completedAt}`);
      if (duration) {
        lines.push(`  Duration:     ${duration}`);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: lines.join("\n"),
          },
        ],
      };
    }
  );

  // Tool 6: FailTask - mark an ongoing task as failed
  server.registerTool(
    "FailTask",
    {
      title: "Fail Task",
      description:
        'Marks an ongoing task as failed. Transitions status from "ongoing" to "failed".',
      inputSchema: {
        id: z.string().describe("Task ID"),
        reason: z.string().optional().describe("Optional failure reason"),
      },
    },
    async ({ id, reason }) => {
      const task = taskStore.findById(id);

      if (!task) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Task not found: ${id}`,
            },
          ],
          isError: true,
        };
      }

      if (task.status !== "ongoing") {
        return {
          content: [
            {
              type: "text" as const,
              text: `Cannot fail task ${id}: current status is '${task.status}' (expected 'ongoing').`,
            },
          ],
          isError: true,
        };
      }

      const updated = taskStore.failTask(id, reason);
      if (!updated) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to mark task ${id} as failed.`,
            },
          ],
          isError: true,
        };
      }

      const lines = [
        `Task ${id} marked as failed.\n`,
        `  Text:      ${updated.text}`,
      ];
      if (updated.result) {
        lines.push(`  Reason:    ${updated.result}`);
      }
      lines.push(`  Failed at: ${updated.completedAt}`);

      return {
        content: [
          {
            type: "text" as const,
            text: lines.join("\n"),
          },
        ],
      };
    }
  );
}

/** Formats task info for WaitForTask response. */
function formatTaskInfo(task: BrowserTask, footer: string): string {
  const lines = [
    "New task available:\n",
    `  ID:         ${task.id}`,
    `  Text:       ${task.text}`,
  ];

  if (task.component) {
    lines.push(`  Component:  ${task.component.name}`);
    if (task.component.element) {
      lines.push(`  Element:    ${task.component.element}`);
    }
    if (task.component.childPath) {
      lines.push(`  Child path: ${task.component.childPath}`);
    }
    if (task.component.file) {
      lines.push(
        `  File:       ${task.component.file}${task.component.line ? `:${task.component.line}` : ""}`
      );
    }
  }

  lines.push(`  Submitted:  ${task.timestamp}`);
  lines.push("");
  lines.push(footer);

  return lines.join("\n");
}

/** Formats a task as a list item. */
function formatTaskListItem(task: BrowserTask): string {
  const lines = [`[${task.status}] | ${task.id} | ${task.text}`];

  if (task.component) {
    let componentLine = `             Component: ${task.component.name}`;
    if (task.component.element) {
      componentLine += ` > ${task.component.element}`;
    }
    if (task.component.childPath) {
      componentLine += ` (${task.component.childPath})`;
    }
    lines.push(componentLine);
  }

  const timestamps: string[] = [];
  timestamps.push(`Submitted: ${task.timestamp}`);
  if (task.startedAt) {
    timestamps.push(`Started: ${task.startedAt}`);
  }
  if (task.completedAt) {
    const label = task.status === "completed" ? "Completed" : "Failed";
    timestamps.push(`${label}: ${task.completedAt}`);
  }
  lines.push(`             ${timestamps.join(" | ")}`);

  if (task.result) {
    lines.push(`             Result: ${task.result}`);
  }

  return lines.join("\n");
}

/** Formats detailed task info for GetTask response. */
function formatTaskDetails(task: BrowserTask): string {
  const lines = [
    `Task ${task.id}:\n`,
    `  Status:     ${task.status}`,
    `  Text:       ${task.text}`,
  ];

  if (task.component) {
    lines.push(`  Component:  ${task.component.name}`);
    if (task.component.element) {
      lines.push(`  Element:    ${task.component.element}`);
    }
    if (task.component.childPath) {
      lines.push(`  Child path: ${task.component.childPath}`);
    }
    if (task.component.file) {
      lines.push(
        `  File:       ${task.component.file}${task.component.line ? `:${task.component.line}` : ""}`
      );
    }
  }

  lines.push(`  Submitted:  ${task.timestamp}`);
  if (task.startedAt) {
    lines.push(`  Started:    ${task.startedAt}`);
  }
  if (task.completedAt) {
    lines.push(`  Completed:  ${task.completedAt}`);
  }
  if (task.result) {
    lines.push(`  Result:     ${task.result}`);
  }

  return lines.join("\n");
}

/** Calculates duration between two ISO timestamps. */
function calculateDuration(
  start: string | undefined,
  end: string | undefined
): string | null {
  if (!start || !end) return null;

  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const diffMs = endMs - startMs;

  if (diffMs < 0) return null;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
