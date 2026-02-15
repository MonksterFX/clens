import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
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
});
