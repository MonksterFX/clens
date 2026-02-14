#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import http from "node:http";

const PORT = Number(process.env.MCP_HTTP_PORT) || 3100;

/**
 * In-memory store for tasks submitted from the browser.
 * Each task has a timestamp and a text description.
 */
interface BrowserTask {
  text: string;
  timestamp: string;
}

const taskQueue: BrowserTask[] = [];

// ---------------------------------------------------------------------------
// HTTP server – receives tasks POSTed from the browser
// ---------------------------------------------------------------------------

/** Collects the full request body from an IncomingMessage stream. */
function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

/** Checks whether the given origin is localhost (any port). */
function isLocalhostOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      url.hostname === "localhost" || url.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

/** Minimal HTTP server that accepts task submissions from the browser. */
const httpServer = http.createServer(async (req, res) => {
  // CORS headers – only allow localhost origins (any port)
  const origin = req.headers.origin;
  if (isLocalhostOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin!);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /task – submit a new task from the browser
  if (req.method === "POST" && req.url === "/task") {
    try {
      const body = JSON.parse(await readBody(req));
      const text = typeof body.text === "string" ? body.text.trim() : "";

      if (!text) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing 'text' field" }));
        return;
      }

      const task: BrowserTask = { text, timestamp: new Date().toISOString() };
      taskQueue.push(task);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, queued: taskQueue.length }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
    }
    return;
  }

  // GET /health – simple health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", pending: taskQueue.length }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// ---------------------------------------------------------------------------
// MCP server – exposes the TaskFromBrowser tool over stdio
// ---------------------------------------------------------------------------

const mcpServer = new McpServer({
  name: "react-visual-debugger-mcp",
  version: "0.1.0",
});

/** Retrieves the next pending task submitted from the browser. */
mcpServer.registerTool(
  "WaitTaskFromBrowser",
  {
    title: "Task From Browser",
    description:
      "Returns the next pending task submitted from the browser. " +
      "The React visual debugger overlay POSTs tasks to this server, " +
      "and this tool dequeues and returns them one at a time.",
    inputSchema: {
      peek: z
        .boolean()
        .optional()
        .describe(
          "If true, returns the next task without removing it from the queue."
        ),
    },
  },
  async ({ peek }) => {
    if (taskQueue.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No pending tasks from the browser.",
          },
        ],
      };
    }

    const task = peek ? taskQueue[0] : taskQueue.shift()!;

    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Task: ${task.text}`,
            `Submitted at: ${task.timestamp}`,
            `Remaining in queue: ${taskQueue.length}`,
          ].join("\n"),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start both servers
// ---------------------------------------------------------------------------

/** Attempts to listen on `port`, retrying up to `maxRetries` times on EADDRINUSE. */
function listenWithRetry(
  server: http.Server,
  port: number,
  maxRetries = 5
): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryListen(p: number) {
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && attempt < maxRetries) {
          attempt++;
          const next = p + 1;
          console.error(
            `[react-visual-debugger-mcp] Port ${p} in use, trying ${next}...`
          );
          tryListen(next);
        } else {
          reject(err);
        }
      });

      server.listen(p, () => resolve(p));
    }

    tryListen(port);
  });
}

/** Boots the HTTP receiver and the stdio MCP transport. */
async function main() {
  // Start HTTP server for browser task submissions, retrying if port is taken
  const actualPort = await listenWithRetry(httpServer, PORT);
  console.error(
    `[react-visual-debugger-mcp] HTTP server listening on http://localhost:${actualPort}`
  );

  // Connect MCP server over stdio
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("[react-visual-debugger-mcp] MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
