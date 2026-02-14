/**
 * MCP server factory and tool registration.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { DEFAULT_WAIT_TIMEOUT_SECS } from "../lib/config.js";
import * as taskQueue from "../state/task-queue.js";

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
  server.registerTool(
    "WaitTaskFromBrowser",
    {
      title: "Task From Browser",
      description:
        "Returns the next pending task submitted from the browser. " +
        "The clens overlay POSTs tasks to this server, " +
        "and this tool dequeues and returns them one at a time.",
      inputSchema: {
        peek: z
          .boolean()
          .optional()
          .describe(
            "If true, returns the next task without removing it from the queue."
          ),
        wait: z
          .boolean()
          .optional()
          .describe(
            "If true, blocks until a task is available instead of returning immediately. " +
              "Respects the 'timeout' parameter (default 30 s)."
          ),
        timeout: z
          .number()
          .optional()
          .describe(
            "Maximum seconds to wait when 'wait' is true. Defaults to 30."
          ),
      },
    },
    async ({ peek, wait, timeout }) => {
      // Block until a task arrives or the timeout expires
      if (wait && taskQueue.size() === 0) {
        const timeoutSecs = timeout ?? DEFAULT_WAIT_TIMEOUT_SECS;
        const arrived = await taskQueue.waitForTask(timeoutSecs * 1000);

        if (!arrived) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No task arrived within ${timeoutSecs}s timeout.`,
              },
            ],
          };
        }
      }

      if (taskQueue.size() === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No pending tasks from the browser.",
            },
          ],
        };
      }

      const task = peek ? taskQueue.peek()! : taskQueue.dequeue()!;

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Task: ${task.text}`,
              `Submitted at: ${task.timestamp}`,
              `Remaining in queue: ${taskQueue.size()}`,
            ].join("\n"),
          },
        ],
      };
    }
  );
}
