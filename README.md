# clens

> A React component inspector for Vite with AI agent integration via MCP

Clens is a development tool that helps you inspect React components and send tasks to AI agents directly from your browser. It consists of three packages:

- **@clens/lens** — Browser overlay for inspecting React components
- **@clens/mcp-server** — MCP server bridging browser tasks to AI agents (Cursor)
- **@clens/dashboard** — Web UI for monitoring task queue and server status

---

## Features

- **Inspect Mode** — Hover any element to see component name, file, and line number
- **Quick Tasks** — Send tasks to your AI agent with component context
- **Dashboard** — Monitor task queue and server status in real-time
- **MCP Integration** — Works with Cursor and other MCP-compatible editors
- **Fast** — Built on Vite with hot module replacement
- **Modern UI** — Draggable toolbar with connection status indicator

---

## Packages

### @clens/lens

Browser-side React component inspector. Adds an overlay with inspection mode.

**Installation:**

```bash
npm install @clens/lens
```

**Usage:**

```typescript
import { enableInspectorOverlay } from "@clens/lens";

if (import.meta.env.DEV) {
  enableInspectorOverlay();
}
```

See [packages/lens/README.md](packages/lens/README.md) for details.

---

### @clens/mcp-server

MCP server that receives tasks from the browser overlay and exposes them to AI agents via the Model Context Protocol.

**Features:**

- Task queue with history (last 50 completed tasks)
- Real-time updates via Server-Sent Events
- HTTP API for task management
- Serves dashboard UI at `/dashboard`
- Supports stdio and SSE transports

See [packages/mcp-server/README.md](packages/mcp-server/README.md) for setup and API docs.

---

### @clens/dashboard

Web dashboard for monitoring the MCP server task queue.

**Features:**

- Real-time task queue display
- Completed task history
- Server status (uptime, transport, connections)
- Individual task deletion
- Clear all tasks

Access at `http://localhost:3100/dashboard` when MCP server is running.

See [packages/dashboard/README.md](packages/dashboard/README.md) for development.

---

## Quick Start

### For New Contributors

1. **Clone and install:**

   ```bash
   git clone https://github.com/nicobailon/clens.git
   cd clens
   npm install
   ```

2. **Build all packages:**

   ```bash
   npm run build
   ```

3. **Run the full stack:**

   ```bash
   npm start
   ```

   This starts:
   - Lens (watch mode)
   - Dashboard dev server (port 5173)
   - MCP server (port 3100)
   - Example app (port 5174)

4. **Open the example:**
   - Example app: http://localhost:5174
   - Dashboard: http://localhost:3100/dashboard

5. **Connect Cursor:**
   - The `.cursor/mcp.json` is already configured for SSE mode
   - Restart Cursor to pick up the MCP config
   - The `WaitTaskFromBrowser` tool is now available

---

## Usage

### 1. Enable the Inspector

In your Vite + React app:

```typescript
// main.tsx
import { enableInspectorOverlay } from "@clens/lens";

if (import.meta.env.DEV) {
  enableInspectorOverlay({
    serverUrl: "http://localhost:3100", // Optional, defaults to this
    token: "", // Optional, for auth
  });
}
```

### 2. Configure Vite

The inspector requires React source info from Babel:

```bash
npm install -D @babel/plugin-transform-react-jsx-source
```

```typescript
// vite.config.ts
import react from "@vitejs/plugin-react";

export default {
  plugins: [
    react({
      babel: {
        plugins: ["@babel/plugin-transform-react-jsx-source"],
      },
    }),
  ],
};
```

### 3. Start the MCP Server

```bash
npm run dev -w @clens/mcp-server
```

Or run the full stack:

```bash
npm start
```

### 4. Use the Inspector

1. Click the **Inspect** button in the toolbar
2. Hover any element to see component info
3. Click an element to open the tooltip
4. Type a task in the tooltip input (e.g., "Make this button green")
5. Press Enter or click **Send**
6. The task appears in your AI agent (Cursor)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (React App)                                │
│  ┌────────────────────────────────┐                 │
│  │  @clens/lens                   │                 │
│  │  • Component inspector         │                 │
│  │  • Toolbar UI                  │                 │
│  │  • Task submission             │                 │
│  └────────────┬───────────────────┘                 │
└───────────────┼─────────────────────────────────────┘
                │ POST /task
                ▼
┌─────────────────────────────────────────────────────┐
│  @clens/mcp-server (Node.js)                        │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ HTTP Server  │  │ Task Queue   │                 │
│  │ (port 3100)  │─▶│ (in-memory)  │                 │
│  └──────────────┘  └──────┬───────┘                 │
│                           │                          │
│  ┌──────────────┐  ┌──────▼───────┐                 │
│  │ Dashboard UI │  │ MCP Server   │                 │
│  │ (SSE stream) │◀─│ (stdio/SSE)  │                 │
│  └──────────────┘  └──────┬───────┘                 │
└────────────────────────────┼────────────────────────┘
                             │ stdio/SSE
                             ▼
                    ┌─────────────────┐
                    │  AI Agent       │
                    │  (Cursor, etc.) │
                    └─────────────────┘
```

---

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development setup.

### Available Scripts

```bash
npm run build          # Build all packages
npm run dev            # Run dashboard + MCP server
npm start              # Run full stack (lens, dashboard, mcp, example)
npm run dev:example    # Run example app only

npm run lint           # Lint all packages
npm run lint:fix       # Auto-fix lint issues
npm run format         # Format code with Prettier
npm run typecheck      # Type-check all packages
npm test               # Run tests with Vitest
npm run clean          # Remove all build artifacts
```

### Project Structure

```
clens/
├── packages/
│   ├── lens/              # Browser inspector overlay
│   │   ├── src/
│   │   │   ├── ui/        # UI components (toolbar, tooltip, etc.)
│   │   │   ├── lib/       # Services (config, health, task)
│   │   │   └── utils/     # Utilities (fiber traversal, etc.)
│   │   └── package.json
│   ├── dashboard/         # Task monitoring dashboard
│   │   ├── src/
│   │   │   ├── components/  # Dashboard components
│   │   │   ├── hooks/       # React hooks
│   │   │   └── lib/         # API client
│   │   └── package.json
│   └── mcp-server/        # MCP server
│       ├── src/
│       │   ├── endpoints/   # HTTP route handlers
│       │   ├── middleware/  # Auth, CORS, etc.
│       │   ├── state/       # Task queue, SSE connections
│       │   └── mcp/         # MCP server & tools
│       └── package.json
├── example/               # Demo Todo app
└── package.json          # Root workspace config
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available options:

| Variable         | Default | Description                           |
| ---------------- | ------- | ------------------------------------- |
| `MCP_HTTP_PORT`  | `3100`  | HTTP server port                      |
| `MCP_TRANSPORT`  | `stdio` | MCP transport mode (`stdio` or `sse`) |
| `MCP_AUTH_TOKEN` | —       | Optional Bearer token for auth        |

### Cursor Setup

See [Cursor Integration](packages/mcp-server/README.md#cursor-configuration) in the MCP server docs.

---

## License

MIT

---

## Acknowledgments

Built with:

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript](https://www.typescriptlang.org/)
