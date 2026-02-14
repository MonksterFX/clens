#!/usr/bin/env node

/**
 * Entry point for the clens MCP server.
 *
 * Boots the HTTP receiver (for browser task submissions) and
 * connects the chosen MCP transport (stdio or SSE).
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { TRANSPORT, PORT } from "./lib/config.js";
import { listenWithRetry } from "./lib/listen.js";
import {
  createHttpServer,
  registerShutdownHandlers,
} from "./server/http-server.js";
import { createMcpServer } from "./mcp/server.js";

/** Boots the HTTP receiver and the chosen MCP transport. */
async function main() {
  const httpServer = createHttpServer();
  registerShutdownHandlers(httpServer);

  const actualPort = await listenWithRetry(httpServer, PORT);
  console.error(
    `[clens-mcp] HTTP server listening on http://localhost:${actualPort}`
  );

  if (TRANSPORT === "sse") {
    console.error(
      `[clens-mcp] MCP transport: SSE (connect at http://localhost:${actualPort}/sse)`
    );
  } else {
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
