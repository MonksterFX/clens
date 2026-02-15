# Quickstart

Get started with clens in your Vite project. This guide will walk you through installing the inspector, connecting to the MCP server, and sending your first task to an AI agent.

---

## Prerequisites

- Node.js 18+
- npm 10+
- A Vite-based project (React or Angular)
- Cursor IDE (or another MCP-compatible editor)

---

## Step 1: Install the Package

Choose the package that matches your framework:

### React

```bash
npm install @clens/react
```

### Angular

```bash
npm install @clens/angular
```

---

## Step 2: Enable the Inspector Overlay

Add the inspector to your application entry point:

### React

```typescript
// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";
import { enableInspectorOverlay } from "@clens/react";

enableInspectorOverlay();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Angular

```typescript
// main.ts
import "zone.js";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { enableInspectorOverlay } from "@clens/angular";

enableInspectorOverlay();

bootstrapApplication(AppComponent);
```

---

## Step 3: Configure Vite

The inspector needs framework-specific build configuration to extract source file information.

### React

Install the Babel plugin for React source info:

```bash
npm install -D @babel/plugin-transform-react-jsx-source
```

Add it to your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["@babel/plugin-transform-react-jsx-source"],
      },
    }),
  ],
});
```

### Angular

Install the Analog.js Vite plugin:

```bash
npm install -D @analogjs/vite-plugin-angular
```

Add it to your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";

export default defineConfig({
  plugins: [angular()],
});
```

---

## Step 4: Start the MCP Server

The MCP server receives tasks from the browser and makes them available to AI agents.

### Option A: From the clens monorepo (contributors)

If you're developing clens itself:

```bash
npm run dev:full
```

This starts the full stack: lens, dashboard, MCP server, and example apps.

### Option B: Standalone (users)

If you've installed `@clens/mcp-server` in your project:

```bash
npx clens-mcp
```

The server starts on port 3100 by default.

---

## Step 5: Connect Cursor

Configure Cursor to connect to the MCP server.

### SSE Mode (Recommended for Development)

Start the MCP server with SSE transport:

```bash
MCP_TRANSPORT=sse npx clens-mcp
```

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "clens": {
      "url": "http://localhost:3100/sse"
    }
  }
}
```

### stdio Mode (Recommended for Production)

Cursor spawns the server process automatically:

```json
{
  "mcpServers": {
    "clens": {
      "command": "npx",
      "args": ["clens-mcp"]
    }
  }
}
```

**Restart Cursor** to apply the configuration.

---

## Step 6: Use the Inspector

1. **Start your dev server:**

   ```bash
   npm run dev
   ```

2. **Open your app** in the browser (e.g., `http://localhost:5173`)

3. **Click the Inspect button** in the clens toolbar (bottom-right corner)

4. **Hover over any element** to see component info (name, file, line)

5. **Click an element** to open the tooltip

6. **Type a task** in the input field (e.g., "Make this button green")

7. **Press Enter** or click **Send**

8. **Switch to Cursor** — the task appears in the AI agent with full component context

---

## Optional: Monitor Tasks

Open the dashboard to see the task queue and history in real-time:

```
http://localhost:3100/dashboard
```

---

## Next Steps

- [**Integration Guide**](integration.md) — Framework-specific configuration details
- [**Configuration**](configuration.md) — Environment variables, auth tokens, custom server URLs
- [**How It Works**](how-it-works.md) — Architecture and data flow
- [**API Reference**](api-reference.md) — MCP tools and HTTP endpoints

---

## Troubleshooting

### No component info appears

- **React**: Ensure `@babel/plugin-transform-react-jsx-source` is installed and configured
- **Angular**: Ensure you're running in development mode (Angular exposes debug info only in dev)

### Connection indicator shows "Disconnected"

- Check that the MCP server is running on port 3100
- Open `http://localhost:3100/health` to verify the server is accessible
- Check browser console for CORS or network errors

### Tasks don't appear in Cursor

- Verify Cursor's MCP configuration in `.cursor/mcp.json`
- Restart Cursor after modifying the configuration
- Check that the transport mode matches (stdio vs SSE)

### Port 3100 is already in use

Set a custom port:

```bash
MCP_HTTP_PORT=4000 npx clens-mcp
```

Update your `enableInspectorOverlay()` config:

```typescript
enableInspectorOverlay({
  serverUrl: "http://localhost:4000",
});
```
