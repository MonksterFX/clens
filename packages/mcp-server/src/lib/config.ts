/**
 * Central configuration derived from environment variables.
 */

/** Transport mode: "stdio" (default) or "sse". */
export const TRANSPORT = (process.env.MCP_TRANSPORT || "stdio").toLowerCase();

/** HTTP port for the browser-facing server. */
export const PORT = Number(process.env.MCP_HTTP_PORT) || 3100;

/** Optional Bearer token for endpoint authorization. */
export const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

/** Default timeout (in seconds) when waiting for a task. */
export const DEFAULT_WAIT_TIMEOUT_SECS = 30;
