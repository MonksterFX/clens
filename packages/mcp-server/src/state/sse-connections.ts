/**
 * Centralized SSE connection tracking for dashboard events.
 *
 * All dashboard SSE connections are registered here so that
 * status and broadcast logic live in a single place.
 */

import http from "node:http";
import type { DashboardEvent } from "../types.js";

/** Active SSE connections from dashboard clients. */
const connections = new Set<http.ServerResponse>();

/** Registers a new dashboard SSE connection. */
export function addConnection(res: http.ServerResponse): void {
  connections.add(res);
}

/** Removes a dashboard SSE connection (e.g. on client disconnect). */
export function removeConnection(res: http.ServerResponse): void {
  connections.delete(res);
}

/** Returns the number of active dashboard SSE connections. */
export function getConnectionCount(): number {
  return connections.size;
}

/** Broadcasts a dashboard event to all connected SSE clients. */
export function broadcast(event: DashboardEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of connections) {
    if (!res.destroyed) {
      res.write(data);
    }
  }
}
