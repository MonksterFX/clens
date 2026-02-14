#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import http from "node:http";

/** Transport mode: "stdio" (default) or "sse". */
const TRANSPORT = (process.env.MCP_TRANSPORT || "stdio").toLowerCase();

const PORT = Number(process.env.MCP_HTTP_PORT) || 3100;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

/**
 * In-memory store for tasks submitted from the browser.
 * Each task has a timestamp and a text description.
 */
interface BrowserTask {
  text: string;
  timestamp: string;
}

const taskQueue: BrowserTask[] = [];

/**
 * Listeners waiting for the next task to arrive.
 * Resolved when a task is pushed to the queue.
 */
const taskWaiters: Array<() => void> = [];

/** Notifies all registered waiters that a new task is available. */
function notifyWaiters() {
  while (taskWaiters.length > 0) {
    const resolve = taskWaiters.shift()!;
    resolve();
  }
}

/** Returns a promise that resolves when a task is enqueued or the timeout expires. */
function waitForTask(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (taskQueue.length > 0) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => {
      // Remove this waiter on timeout
      const idx = taskWaiters.indexOf(onTask);
      if (idx !== -1) taskWaiters.splice(idx, 1);
      resolve(false);
    }, timeoutMs);

    function onTask() {
      clearTimeout(timer);
      resolve(true);
    }

    taskWaiters.push(onTask);
  });
}

/** Default timeout (in seconds) when waiting for a task. */
const DEFAULT_WAIT_TIMEOUT_SECS = 30;

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

/**
 * Validates the Authorization header against the configured token.
 * Returns true if auth is disabled or the token matches.
 */
function isAuthorized(authHeader: string | undefined): boolean {
  // If no token is configured, skip auth
  if (!AUTH_TOKEN) return true;

  if (!authHeader) return false;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  return match[1] === AUTH_TOKEN;
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
    // Check authorization
    if (!isAuthorized(req.headers.authorization)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

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
      notifyWaiters();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, queued: taskQueue.length }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
    }
    return;
  }

  // GET /sse – establish SSE connection for MCP transport
  if (req.method === "GET" && req.url === "/sse") {
    const transport = new SSEServerTransport("/messages", res);
    sseTransports.set(transport.sessionId, transport);

    const server = createMcpServer();
    await server.connect(transport);

    transport.onclose = () => {
      sseTransports.delete(transport.sessionId);
    };

    console.error(
      `[clens-mcp] SSE session ${transport.sessionId} connected`
    );
    return;
  }

  // POST /messages?sessionId=xxx – receive MCP messages from SSE client
  if (req.method === "POST" && req.url?.startsWith("/messages")) {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const transport = sseTransports.get(sessionId);

    if (!transport) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unknown or expired session" }));
      return;
    }

    await transport.handlePostMessage(req, res);
    return;
  }

  // GET /health – simple health check
  if (req.method === "GET" && req.url === "/health") {
    // Check authorization
    if (!isAuthorized(req.headers.authorization)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        pending: taskQueue.length,
        authenticated: !!AUTH_TOKEN,
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// ---------------------------------------------------------------------------
// MCP server – exposes the TaskFromBrowser tool
// ---------------------------------------------------------------------------

/** Creates a new McpServer instance with all tools registered. */
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "clens-mcp",
    version: "0.1.0",
  });

  registerTools(server);
  return server;
}

/** Registers all MCP tools on the given server instance. */
function registerTools(server: McpServer): void {
  /** Retrieves the next pending task submitted from the browser. */
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
      // If wait flag is set and the queue is empty, block until a task arrives or timeout
      if (wait && taskQueue.length === 0) {
        const timeoutSecs = timeout ?? DEFAULT_WAIT_TIMEOUT_SECS;
        const arrived = await waitForTask(timeoutSecs * 1000);

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
}

// ---------------------------------------------------------------------------
// SSE session management
// ---------------------------------------------------------------------------

/** Active SSE transports keyed by session ID. */
const sseTransports = new Map<string, SSEServerTransport>();

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
            `[clens-mcp] Port ${p} in use, trying ${next}...`
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

/** Boots the HTTP receiver and the chosen MCP transport. */
async function main() {
  // Start HTTP server for browser task submissions (and SSE if enabled)
  const actualPort = await listenWithRetry(httpServer, PORT);
  console.error(
    `[clens-mcp] HTTP server listening on http://localhost:${actualPort}`
  );

  if (TRANSPORT === "sse") {
    // SSE mode – MCP clients connect via GET /sse on the HTTP server
    console.error(
      `[clens-mcp] MCP transport: SSE (connect at http://localhost:${actualPort}/sse)`
    );
  } else {
    // stdio mode (default) – MCP client communicates over stdin/stdout
    const mcpServer = createMcpServer();
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error("[clens-mcp] MCP transport: stdio");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
