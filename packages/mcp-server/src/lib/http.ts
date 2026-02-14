/**
 * Low-level HTTP helpers.
 */

import http from "node:http";

/** Default maximum request body size (1 MB). */
const MAX_BODY_SIZE = 1024 * 1024;

/**
 * Collects the full request body from an IncomingMessage stream.
 * Rejects early if the accumulated size exceeds `maxSize` to prevent DoS.
 */
export function readBody(
  req: http.IncomingMessage,
  maxSize = MAX_BODY_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        reject(new Error(`Request body exceeds ${maxSize} bytes`));
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}
