import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/dashboard/" : "/",
  server: {
    port: 3101,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));
