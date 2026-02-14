/**
 * Static file serving for the dashboard UI.
 *
 * Uses express.static for the @clens/dashboard/dist directory,
 * with SPA fallback to index.html for client-side routing.
 */

import express, { type Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Resolves the dashboard dist directory. */
function getDashboardDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const mcpServerRoot = path.resolve(currentFile, "../../../..");
  const dashboardDist = path.resolve(mcpServerRoot, "../dashboard/dist");
  return dashboardDist;
}

/** Creates an Express router that serves the dashboard static files. */
export function createDashboardRouter(): Router {
  const router = express.Router();
  const dashboardDir = getDashboardDir();

  // Serve static assets from the dashboard build output
  router.use(express.static(dashboardDir));

  // SPA fallback — serve index.html for all unmatched routes
  router.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "index.html"), (err) => {
      if (err) {
        res.status(404).send(
          "Dashboard not found. Run 'npm run build' in packages/dashboard."
        );
      }
    });
  });

  return router;
}
