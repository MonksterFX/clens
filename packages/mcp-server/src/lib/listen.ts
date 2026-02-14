/**
 * Utility for starting an HTTP server with automatic port retry.
 */

import http from "node:http";

/** Attempts to listen on `port`, retrying up to `maxRetries` times on EADDRINUSE. */
export function listenWithRetry(
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
