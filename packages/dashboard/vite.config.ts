import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Vite config for the CLens dashboard. Proxies API calls to the MCP server in dev mode. */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/dashboard/" : "/",
  server: {
    port: 3101,
    strictPort: false,
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
}));
