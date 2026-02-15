/**
 * Status bar component displaying server information.
 */

import type { ServerStatus } from "../lib/api";

interface StatusBarProps {
  status: ServerStatus | null;
  connected: boolean;
  activeTaskCount?: number;
}

/**
 * Formats uptime in milliseconds to a human-readable string.
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/** Displays server status information including connection state and active queue. */
export function StatusBar({
  status,
  connected,
  activeTaskCount,
}: StatusBarProps) {
  if (!status) {
    return (
      <div className="status-bar loading">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="label">Status:</span>
        <span className={`value ${connected ? "connected" : "disconnected"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <div className="status-item">
        <span className="label">Uptime:</span>
        <span className="value">{formatUptime(status.uptime)}</span>
      </div>
      <div className="status-item">
        <span className="label">Transport:</span>
        <span className="value">{status.transport}</span>
      </div>
      <div className="status-item">
        <span className="label">Port:</span>
        <span className="value">{status.port}</span>
      </div>
      <div className="status-item">
        <span className="label">Active Queue:</span>
        <span className="value">{activeTaskCount ?? status.queueSize}</span>
      </div>
      <div className="status-item">
        <span className="label">SSE Sessions:</span>
        <span className="value">{status.activeSseSessions}</span>
      </div>
    </div>
  );
}
