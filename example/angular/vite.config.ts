import path from "path";
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";

export default defineConfig({
  plugins: [angular()],
  server: {
    port: 5175,
  },
  resolve: {
    mainFields: ["module"],
    alias: {
      "@clens/angular": path.resolve(
        __dirname,
        "../../packages/angular/src/index.ts"
      ),
      "@clens/lens": path.resolve(
        __dirname,
        "../../packages/lens/src/index.tsx"
      ),
    },
  },
});
