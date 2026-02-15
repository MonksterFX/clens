# @clens/dashboard

> Real-time monitoring dashboard for clens MCP server

This package provides a React-based web UI for monitoring the task queue, viewing completed tasks, and checking server status. It connects to the MCP server via Server-Sent Events for real-time updates.

**User-facing documentation:** See [docs/quickstart.md](../../docs/quickstart.md)

---

## Development

### Run Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173/dashboard`

The Vite dev server proxies API calls to the MCP server at `localhost:3100`.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`, which is bundled with the MCP server and served at `/dashboard`.

### Type-check

```bash
npm run typecheck
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

---

## Package Structure

```
packages/dashboard/
├── src/
│   ├── components/          # UI components
│   │   ├── StatusBar.tsx    # Server status display
│   │   ├── TaskQueue.tsx    # Pending tasks list
│   │   └── TaskHistory.tsx  # Completed tasks list
│   ├── hooks/               # React hooks
│   │   ├── useServerStatus.ts  # Polls /api/status
│   │   └── useTaskEvents.ts    # Subscribes to SSE
│   ├── lib/                 # API client
│   │   └── api.ts           # HTTP requests
│   ├── App.tsx              # Main app component
│   ├── index.css            # Global styles
│   └── main.tsx             # Entry point
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── package.json
└── tsconfig.json
```

---

## Key Concepts

### Components

**StatusBar** — Displays server status at the top:

- Uptime
- Transport mode (stdio/SSE)
- HTTP port
- Queue size (all statuses)
- Active SSE sessions

**TaskQueue** — Lists pending tasks:

- Task ID, text, component info
- Individual delete buttons
- Clear All button (removes all pending tasks)

**TaskHistory** — Lists completed tasks (last 50):

- Task ID, text, component info
- Submission, start, and completion timestamps
- Result or failure reason

### Hooks

**useServerStatus** — Polls `/api/status` every 2 seconds:

```typescript
function useServerStatus() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getStatus();
        setStatus(data);
      } catch (err) {
        setError(err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { status, error };
}
```

**useTaskEvents** — Subscribes to `/api/events` SSE stream:

```typescript
function useTaskEvents(callback) {
  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.addEventListener("task_enqueued", (event) => {
      const data = JSON.parse(event.data);
      callback({ type: "task_enqueued", task: data.task });
    });

    eventSource.addEventListener("task_dequeued", (event) => {
      const data = JSON.parse(event.data);
      callback({ type: "task_dequeued", task: data.task });
    });

    // ... other event types

    return () => eventSource.close();
  }, [callback]);
}
```

### API Client

All HTTP requests go through `lib/api.ts`:

**Functions:**

- `getStatus()` — GET /api/status
- `getTasks()` — GET /api/tasks
- `getHistory()` — GET /api/tasks/history
- `deleteTask(id)` — DELETE /api/tasks/:id
- `clearTasks()` — DELETE /api/tasks
- `subscribeToEvents(callback)` — SSE subscription to /api/events

Example:

```typescript
export async function getStatus(): Promise<ServerStatus> {
  const response = await fetch("/api/status");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
```

---

## Vite Configuration

### API Proxy

The dev server proxies API calls to avoid CORS issues:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3100",
      "/task": "http://localhost:3100",
      "/health": "http://localhost:3100",
    },
  },
  base: "/dashboard/",
});
```

**Note:** `base: "/dashboard/"` ensures the production build works when served at `/dashboard` by the MCP server.

---

## Styling

Uses CSS variables for theming with automatic dark mode support:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #212529;
  --border-color: #dee2e6;
  --accent: #0d6efd;
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #212529;
    --text-primary: #f8f9fa;
    --border-color: #495057;
    --accent: #0d6efd;
    /* ... */
  }
}
```

**No CSS-in-JS libraries** — Plain CSS with variables for maintainability.

---

## Testing with MCP Server

```bash
# Terminal 1: Start MCP server
npm run dev -w @clens/mcp-server

# Terminal 2: Start dashboard dev server
npm run dev -w @clens/dashboard
```

Submit tasks from the browser overlay and verify they appear in the dashboard in real-time.

---

## Production Build

The dashboard is built and bundled with the MCP server:

1. Dashboard runs `npm run build` → outputs to `dist/`
2. MCP server bundles dashboard `dist/` into its build
3. MCP server serves dashboard at `/dashboard`

Access: `http://localhost:3100/dashboard`

---

## Dependencies

- **react** and **react-dom** — UI components
- **@clens/react** — Used internally (not exposed)
- **vite** — Build tool and dev server

---

## Next Steps

- [**API Reference**](../../docs/api-reference.md) — HTTP endpoints and SSE events
- [**Development Guide**](../../docs/development.md) — Monorepo development workflow
