/**
 * CORS helpers — allows all localhost origins (any port, any protocol).
 */

import http from "node:http";

/** Set of hostnames considered localhost. */
const LOCALHOST_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
]);

/** Checks whether the given origin is a localhost address (any port). */
export function isLocalhostOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return LOCALHOST_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Applies CORS headers to the response.
 *
 * For requests with a recognized localhost origin the exact origin is echoed
 * back. For API routes (`/api/*`) without an origin header (e.g. curl,
 * Postman, server-to-server) the wildcard `*` is used so direct local
 * clients are never blocked.
 */
export function applyCorsHeaders(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const origin = req.headers.origin;

  if (isLocalhostOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin!);
  } else if (!origin && req.url?.startsWith("/api")) {
    // Allow origin-less requests (curl, Postman, etc.) on API routes
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
