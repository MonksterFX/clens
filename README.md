# clens

> Component inspector for Vite with AI agent integration via MCP

Clens helps you inspect React and Angular components and send tasks to AI agents directly from your browser. It bridges the gap between visual debugging and AI-assisted development.

---

## Features

- **Inspect Mode** — Hover any element to see component name, file, and line number
- **Quick Tasks** — Send tasks to your AI agent with full component context
- **Dashboard** — Monitor task queue and server status in real-time
- **MCP Integration** — Works with Cursor and other MCP-compatible editors
- **Fast** — Built on Vite with hot module replacement
- **Modern UI** — Draggable toolbar with connection status indicator

---

## Packages

| Package             | Description                                        | Links                                   |
| ------------------- | -------------------------------------------------- | --------------------------------------- |
| `@clens/lens`       | Core browser overlay (UI, toolbar, tooltip)        | [README](packages/lens/README.md)       |
| `@clens/react`      | React fiber traversal and component resolution     | [README](packages/react/README.md)      |
| `@clens/angular`    | Angular debug API wrapper and component resolution | [README](packages/angular/README.md)    |
| `@clens/mcp-server` | MCP server with HTTP API, task queue, SSE          | [README](packages/mcp-server/README.md) |
| `@clens/dashboard`  | Real-time monitoring UI for task queue             | [README](packages/dashboard/README.md)  |

---

## Quick Links

- [**Quickstart**](docs/quickstart.md) — Install and set up clens in 5 minutes
- [**Integration Guide**](docs/integration.md) — Framework-specific setup (React, Angular, custom)
- [**Configuration**](docs/configuration.md) — Environment variables, Cursor setup, auth tokens
- [**How It Works**](docs/how-it-works.md) — Architecture, data flow, component resolution
- [**Development Guide**](docs/development.md) — Contributing to clens
- [**API Reference**](docs/api-reference.md) — MCP tools and HTTP endpoints

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (React/Angular App)                        │
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

See [How It Works](docs/how-it-works.md) for detailed architecture documentation.

---

## Installation

### React

```bash
npm install @clens/react
```

```typescript
// main.tsx
import { enableInspectorOverlay } from "@clens/react";

if (import.meta.env.DEV) {
  enableInspectorOverlay();
}
```

See [Integration Guide](docs/integration.md#react) for complete setup.

### Angular

```bash
npm install @clens/angular
```

```typescript
// main.ts
import { enableInspectorOverlay } from "@clens/angular";

if (import.meta.env.DEV) {
  enableInspectorOverlay();
}
```

See [Integration Guide](docs/integration.md#angular) for complete setup.

---

## Development

### Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/clens.git
cd clens
npm install

# Build all packages
npm run build

# Start full stack
npm start
```

This starts:

- Lens, React, and Angular packages (watch mode)
- Dashboard dev server (http://localhost:5173/dashboard)
- MCP server (http://localhost:3100)
- React example (http://localhost:5174)
- Angular example (http://localhost:5175)

See [Development Guide](docs/development.md) for detailed instructions.

### Available Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run build`       | Build all packages                       |
| `npm run dev`         | Run dashboard + MCP server               |
| `npm start`           | Run full stack (all packages + examples) |
| `npm run dev:example` | Run example apps only                    |
| `npm run lint`        | Lint all packages                        |
| `npm run lint:fix`    | Auto-fix lint issues                     |
| `npm run format`      | Format code with Prettier                |
| `npm run typecheck`   | Type-check all packages                  |
| `npm test`            | Run tests with Vitest                    |
| `npm run clean`       | Remove all build artifacts               |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process
- Commit message conventions

---

## License

MIT

---

## Acknowledgments

Built with:

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Angular](https://angular.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript](https://www.typescriptlang.org/)
