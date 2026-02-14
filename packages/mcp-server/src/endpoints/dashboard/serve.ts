/**
 * Static file serving for the dashboard UI.
 *
 * Serves files from @clens/dashboard/dist/ for GET /dashboard* requests.
 */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Resolves the dashboard dist directory. */
function getDashboardDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const mcpServerRoot = path.resolve(currentFile, "../../../..");
  const dashboardDist = path.resolve(mcpServerRoot, "../dashboard/dist");
  return dashboardDist;
}

/** MIME type mapping for common file extensions. */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/** Determines the MIME type based on file extension. */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/** Handles GET /dashboard* requests — serves static files from dashboard dist. */
export async function handleDashboard(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    const dashboardDir = getDashboardDir();

    // Remove /dashboard prefix and get requested path
    let requestPath = req.url?.replace(/^\/dashboard\/?/, "") || "";

    // Default to index.html for directory requests or SPA routing
    if (!requestPath || requestPath.endsWith("/")) {
      requestPath = "index.html";
    }

    // Security: prevent directory traversal
    const safePath = path
      .normalize(requestPath)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    let filePath = path.join(dashboardDir, safePath);

    // Try to read the file
    try {
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      const content = await fs.readFile(filePath);
      const mimeType = getMimeType(filePath);

      res.writeHead(200, {
        "Content-Type": mimeType,
        "Content-Length": content.length,
      });
      res.end(content);
    } catch (err: any) {
      // File not found - serve index.html for SPA routing
      if (err.code === "ENOENT") {
        try {
          const indexPath = path.join(dashboardDir, "index.html");
          const content = await fs.readFile(indexPath);
          res.writeHead(200, {
            "Content-Type": "text/html",
            "Content-Length": content.length,
          });
          res.end(content);
        } catch {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end(
            "Dashboard not found. Run 'npm run build' in packages/dashboard."
          );
        }
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error("Dashboard serving error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
}
