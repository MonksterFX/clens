/**
 * SSE transport endpoints for MCP-over-HTTP.
 *
 * GET  /sse                — establishes an SSE connection
 * POST /messages?sessionId — relays MCP messages for a session
 *
 * NOTE: Each SSE connection gets its own McpServer instance because the
 * MCP SDK's Server class only supports a single transport at a time.
 * Shared state (e.g. the task queue) lives in module-level singletons
 * so all instances see the same data.
 */

import type { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import { createMcpServer } from "../mcp/server.js";

/** Active SSE transports keyed by session ID. */
const sseTransports = new Map<string, SSEServerTransport>();

/** Handles GET /sse — opens a new SSE session. */
export async function handleSseConnect(
  _req: Request,
  res: Response
): Promise<void> {
  const transport = new SSEServerTransport("/messages", res);
  sseTransports.set(transport.sessionId, transport);

  const server = createMcpServer();
  await server.connect(transport);

  transport.onclose = () => {
    sseTransports.delete(transport.sessionId);
  };

  console.error(`[clens-mcp] SSE session ${transport.sessionId} connected`);
}

/** Handles POST /messages?sessionId=xxx — relays MCP messages for an active session. */
export async function handleSseMessage(
  req: Request,
  res: Response
): Promise<void> {
  const sessionId = (req.query.sessionId as string) ?? "";
  const transport = sseTransports.get(sessionId);

  if (!transport) {
    res.status(400).json({ error: "Unknown or expired session" });
    return;
  }

  await transport.handlePostMessage(req, res);
}
