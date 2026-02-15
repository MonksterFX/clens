# Development Guide

This guide covers how to set up the clens monorepo for development, build packages, run tests, and contribute changes.

---

## Prerequisites

- **Node.js** 18+ (we use 24.x in production)
- **npm** 10+
- **Git**

---

## Initial Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/clens.git
   cd clens
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   This installs all workspace packages in one command (monorepo setup).

3. **Build all packages:**

   ```bash
   npm run build
   ```

   This compiles lens, react, angular, dashboard, and mcp-server in the correct order.

4. **Start the full development environment:**

   ```bash
   npm start
   ```

   This starts all services:
   - **Lens** (watch mode) — rebuilds on changes
   - **React adapter** (watch mode) — rebuilds on changes
   - **Angular adapter** (watch mode) — rebuilds on changes
   - **Dashboard** (Vite dev server) — http://localhost:5173/dashboard
   - **MCP Server** (watch mode) — http://localhost:3100
   - **React example** — http://localhost:5174
   - **Angular example** — http://localhost:5175

---

## Project Structure

```
clens/
├── packages/
│   ├── lens/              # Browser inspector overlay
│   │   ├── src/
│   │   │   ├── ui/        # Toolbar, tooltip, settings panel
│   │   │   ├── lib/       # Services (config, health, task)
│   │   │   └── index.tsx  # Entry point
│   │   └── package.json
│   ├── react/             # React fiber resolver
│   │   ├── src/
│   │   │   ├── fiber.ts   # React fiber traversal
│   │   │   └── index.ts   # Wrapper for lens
│   │   └── package.json
│   ├── angular/           # Angular resolver
│   │   ├── src/
│   │   │   ├── angular-resolver.ts  # window.ng API wrapper
│   │   │   └── index.ts              # Wrapper for lens
│   │   └── package.json
│   ├── dashboard/         # Monitoring UI
│   │   ├── src/
│   │   │   ├── components/  # StatusBar, TaskQueue, TaskHistory
│   │   │   ├── hooks/       # useServerStatus, useTaskEvents
│   │   │   ├── lib/         # API client
│   │   │   └── App.tsx
│   │   └── package.json
│   └── mcp-server/        # MCP server
│       ├── src/
│       │   ├── endpoints/   # HTTP route handlers
│       │   ├── middleware/  # Auth, CORS, logger
│       │   ├── state/       # Task queue, SSE connections
│       │   ├── mcp/         # MCP server & tools
│       │   └── index.ts
│       └── package.json
├── example/
│   ├── react/             # React example app
│   └── angular/           # Angular example app
├── tasks/                 # Task backlog and completed work
├── docs/                  # User-facing documentation
├── CONTRIBUTING.md        # Contribution guide
└── package.json           # Root workspace config
```

---

## Development Workflows

### Working on Lens

```bash
# Start watch mode (rebuilds on changes)
npm run dev -w @clens/lens

# In another terminal, start an example app
npm run dev -w example-react
# or
npm run dev -w example-angular
```

Changes to lens source will trigger rebuilds. Refresh the browser to see updates.

**Key files:**

- `packages/lens/src/ui/overlay.tsx` — Main overlay component
- `packages/lens/src/ui/toolbar/toolbar.tsx` — Toolbar UI
- `packages/lens/src/ui/tooltip/tooltip.tsx` — Tooltip component
- `packages/lens/src/lib/services/task.ts` — Task submission logic
- `packages/lens/src/lib/services/health.ts` — Server health checks

### Working on Dashboard

```bash
# Start dashboard dev server
npm run dev -w @clens/dashboard

# In another terminal, start MCP server (for API)
npm run dev -w @clens/mcp-server
```

Open http://localhost:5173/dashboard

The Vite dev server proxies API calls to the MCP server at localhost:3100.

**Key files:**

- `packages/dashboard/src/App.tsx` — Main app component
- `packages/dashboard/src/components/StatusBar.tsx` — Server status display
- `packages/dashboard/src/components/TaskQueue.tsx` — Pending tasks list
- `packages/dashboard/src/components/TaskHistory.tsx` — Completed tasks
- `packages/dashboard/src/hooks/useTaskEvents.ts` — SSE subscription
- `packages/dashboard/src/lib/api.ts` — API client

### Working on MCP Server

```bash
# Start in watch mode (restarts on changes via tsx)
npm run dev -w @clens/mcp-server
```

The server restarts automatically on file changes.

**Key files:**

- `packages/mcp-server/src/index.ts` — Entry point
- `packages/mcp-server/src/mcp/server.ts` — MCP tool registration
- `packages/mcp-server/src/endpoints/task.ts` — POST /task handler
- `packages/mcp-server/src/endpoints/api/*.ts` — REST API handlers
- `packages/mcp-server/src/state/task-store.ts` — In-memory task queue
- `packages/mcp-server/src/state/sse-connections.ts` — SSE connection manager

### Working on React Adapter

```bash
# Start watch mode
npm run dev -w @clens/react

# In another terminal, start React example
npm run dev -w example-react
```

**Key files:**

- `packages/react/src/fiber.ts` — React fiber traversal and resolution
- `packages/react/src/index.ts` — Wrapper that calls lens with resolver

### Working on Angular Adapter

```bash
# Start watch mode
npm run dev -w @clens/angular

# In another terminal, start Angular example
npm run dev -w example-angular
```

**Key files:**

- `packages/angular/src/angular-resolver.ts` — Angular debug API wrapper
- `packages/angular/src/index.ts` — Wrapper that calls lens with resolver

---

## Available Scripts

Run from the root directory:

| Script                  | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm run build`         | Build all packages                          |
| `npm run dev`           | Run dashboard + MCP server                  |
| `npm run dev:full`      | Run full stack (all packages + examples)    |
| `npm start`             | Alias for `dev:full`                        |
| `npm run dev:example`   | Run both example apps                       |
| `npm run lint`          | Lint all packages                           |
| `npm run lint:fix`      | Auto-fix lint issues                        |
| `npm run format`        | Format code with Prettier                   |
| `npm run format:check`  | Check formatting without changes            |
| `npm run typecheck`     | Type-check all packages                     |
| `npm test`              | Run tests with Vitest                       |
| `npm run test:ui`       | Open Vitest UI                              |
| `npm run test:coverage` | Generate coverage report                    |
| `npm run clean`         | Remove all build artifacts and node_modules |

Run package-specific scripts with `-w`:

```bash
npm run build -w @clens/lens
npm run dev -w @clens/mcp-server
npm test -w @clens/dashboard
```

---

## Testing

We use Vitest for testing.

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

### Writing Tests

Test files live next to source files with a `.test.ts` or `.test.tsx` extension:

```
packages/lens/src/
├── lib/
│   ├── config/
│   │   ├── connection.ts
│   │   └── connection.test.ts  ← Test file
```

**Example test:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getConfig, setConfig } from "./connection";

describe("connection config", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should have default config", () => {
    const config = getConfig();
    expect(config.serverUrl).toBe("http://localhost:3100");
  });

  it("should persist changes", () => {
    setConfig({ serverUrl: "http://localhost:4000" });
    const config = getConfig();
    expect(config.serverUrl).toBe("http://localhost:4000");
  });
});
```

### Coverage Goals

- **Utilities:** 80%+ coverage
- **State management:** 80%+ coverage
- **Components:** 60%+ coverage (focus on logic, not styling)

---

## Code Style

We use ESLint + Prettier for code quality and formatting.

### Pre-commit Hooks

Husky automatically runs before commits:

- Lint and fix auto-fixable issues
- Format code with Prettier
- Block commit if errors remain

### Manual Checks

```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
npm run format         # Format all files
npm run typecheck      # Verify TypeScript
```

### Style Guidelines

- **Indentation:** 2 spaces, no tabs
- **Quotes:** Double quotes for strings
- **Semicolons:** Always use semicolons
- **Line length:** 80 characters (soft limit)
- **File naming:** camelCase for utilities, PascalCase for components
- **Exports:** Named exports preferred over default exports

---

## Debugging

### MCP Server

The server logs to stdout. Increase verbosity:

```bash
DEBUG=* npm run dev -w @clens/mcp-server
```

### Browser Overlay

Open browser DevTools console to see overlay logs:

- Task submissions
- Health check responses
- Connection status changes
- Component resolution results

Add debug logs in development:

```typescript
if (import.meta.env.DEV) {
  console.log("[clens]", data);
}
```

### MCP Tools in Cursor

Check Cursor's MCP logs:

- **Settings** → **MCP** → **View Logs**

---

## Building for Production

### Build All Packages

```bash
npm run build
```

This runs the build script for each package in dependency order:

1. `@clens/lens`
2. `@clens/react` and `@clens/angular` (depend on lens)
3. `@clens/dashboard` (depends on react)
4. `@clens/mcp-server` (depends on dashboard and lens)

### Build Individual Packages

```bash
npm run build -w @clens/lens
npm run build -w @clens/mcp-server
```

### Output Directories

- **lens, react, angular:** `dist/` (ESM bundles via tsdown)
- **dashboard:** `dist/` (static HTML/CSS/JS via Vite)
- **mcp-server:** `dist/` (CommonJS via tsdown)

---

## Publishing

(For maintainers only)

1. **Update versions:**

   ```bash
   npx changeset
   ```

   Follow prompts to select packages and version bump types.

2. **Review changelog:**

   ```bash
   cat .changeset/*.md
   ```

3. **Bump versions and update changelog:**

   ```bash
   npx changeset version
   ```

4. **Commit changes:**

   ```bash
   git add .
   git commit -m "chore: release"
   ```

5. **Publish to npm:**

   ```bash
   npx changeset publish
   ```

6. **Push tags:**

   ```bash
   git push --follow-tags
   ```

---

## Troubleshooting

### Build Errors

**"Cannot find module '@clens/lens'"**

Run `npm run build` from the root to build all packages in the correct order.

**"Type error in packages/dashboard"**

Build lens first:

```bash
npm run build -w @clens/lens
npm run build -w @clens/dashboard
```

### Watch Mode Not Detecting Changes

Restart the watch process:

```bash
# Ctrl+C to stop
npm run dev -w @clens/lens
```

### Port Already in Use

Kill the process using the port:

```bash
# macOS/Linux
lsof -ti:3100 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Or use different ports
MCP_HTTP_PORT=4000 npm run dev -w @clens/mcp-server
```

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:

- Pull request process
- Commit message guidelines
- Code review expectations
- Branch naming conventions

---

## Next Steps

- [**How It Works**](how-it-works.md) — Architecture and internals
- [**API Reference**](api-reference.md) — HTTP and MCP tool documentation
- [**Integration Guide**](integration.md) — Adding support for new frameworks
