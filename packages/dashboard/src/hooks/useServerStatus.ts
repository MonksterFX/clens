/**
 * Hook for polling server status.
 */

import { useEffect, useState } from "react";
import { getStatus, type ServerStatus } from "../lib/api";

/**
 * Polls the server status at a regular interval.
 */
export function useServerStatus(intervalMs = 2000): ServerStatus | null {
  const [status, setStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const data = await getStatus();
        if (mounted) {
          setStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
      }
    }

    fetchStatus();
    const timer = setInterval(fetchStatus, intervalMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return status;
}
