/**
 * Dashboard serving with automatic dev/production detection.
 *
 * In development: proxies requests to the Vite dev server (port 3101)
 * for HMR and live reloading. Falls back to static files if Vite is
 * not running.
 *
 * In production: serves the pre-built @clens/dashboard/dist directory
 * with SPA fallback to index.html for client-side routing.
 */

import http from "node:http";
import express, {
  type Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VITE_DEV_PORT = 3101;
const VITE_DEV_ORIGIN = `http://localhost:${VITE_DEV_PORT}`;

/** Resolves the dashboard dist directory. */
function getDashboardDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const mcpServerRoot = path.resolve(currentFile, "../../../..");
  const dashboardDist = path.resolve(mcpServerRoot, "../dashboard/dist");
  return dashboardDist;
}

/**
 * Proxies a request to the Vite dev server.
 * Calls next() on connection error so Express falls through to static serving.
 */
function viteDevProxy(req: Request, res: Response, next: NextFunction): void {
  const target = new URL(VITE_DEV_ORIGIN);

  const proxyReq = http.request(
    {
      hostname: target.hostname,
      port: target.port,
      path: req.url || "/",
      method: req.method,
      headers: { ...req.headers, host: target.host },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on("error", () => next());
  req.pipe(proxyReq, { end: true });
}

/** Creates an Express router that serves the dashboard (dev proxy or static). */
export function createDashboardRouter(): Router {
  const router = express.Router();
  const dashboardDir = getDashboardDir();

  // Try proxying to Vite dev server first — silently falls through
  // with ECONNREFUSED (<1 ms) when Vite is not running (production).
  router.use(viteDevProxy);

  // Serve static assets from the dashboard build output
  router.use(express.static(dashboardDir));

  // SPA fallback — serve index.html for all unmatched routes
  router.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "index.html"), (err) => {
      if (err) {
        res
          .status(404)
          .send(
            "Dashboard not found. Run 'npm run build' in packages/dashboard."
          );
      }
    });
  });

  return router;
}
