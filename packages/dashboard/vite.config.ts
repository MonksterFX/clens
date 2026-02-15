import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Vite config for the CLens dashboard. Proxies API calls to the MCP server in dev mode. */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/dashboard/" : "/",
  server: {
    port: 3101,
    strictPort: false,
    hmr: {
      // When the dashboard is served via the MCP proxy (port 3100),
      // the HMR WebSocket must connect directly to the Vite dev server.
      clientPort: 3101,
    },
    proxy: {
      "/api": "http://localhost:3100",
      "/task": "http://localhost:3100",
      "/health": "http://localhost:3100",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@clens/react": path.resolve(
        __dirname,
        "../../packages/react/src/index.ts"
      ),
      "@clens/lens": path.resolve(
        __dirname,
        "../../packages/lens/src/index.tsx"
      ),
    },
  },
}));
