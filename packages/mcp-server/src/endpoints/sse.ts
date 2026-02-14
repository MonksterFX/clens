/**
 * SSE transport endpoints for MCP-over-HTTP.
 *
 * GET  /sse                — establishes an SSE connection
 * POST /messages?sessionId — relays MCP messages for a session
 */

import http from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import { createMcpServer } from "../mcp/server.js";

/** Active SSE transports keyed by session ID. */
const sseTransports = new Map<string, SSEServerTransport>();

/** Handles GET /sse — opens a new SSE session. */
export async function handleSseConnect(
  _req: http.IncomingMessage,
  res: http.ServerResponse
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
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const url = new URL(req.url!, `http://${req.headers.host || "localhost"}`);
  const sessionId = url.searchParams.get("sessionId") ?? "";
  const transport = sseTransports.get(sessionId);

  if (!transport) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unknown or expired session" }));
    return;
  }

  await transport.handlePostMessage(req, res);
}
