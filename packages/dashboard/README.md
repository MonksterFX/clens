# @clens/dashboard

> Real-time monitoring dashboard for clens MCP server

Web UI for viewing the task queue, completed tasks, and server status. Connects to the MCP server via Server-Sent Events for real-time updates.

## Features

- **Task Queue** — View pending tasks with individual delete buttons
- **Task History** — See last 50 completed tasks
- **Server Status** — Uptime, transport mode, port, queue size, SSE sessions
- **Real-time Updates** — Automatically refreshes via SSE
- **Clear All** — Bulk delete pending tasks

## Access

When the MCP server is running, access the dashboard at:

```
http://localhost:3100/dashboard
```

## Development

### Run Vite Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173/dashboard/`

### API Proxy

The dev server proxies API calls to the MCP server at `localhost:3100`:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3100",
      "/task": "http://localhost:3100",
      "/health": "http://localhost:3100",
    },
  },
});
```

### Build for Production

```bash
npm run build
```

Output goes to `dist/`, which is served by the MCP server at `/dashboard/`.

## Architecture

### Components

- `StatusBar` — Displays server status
- `TaskQueue` — Pending tasks with delete/clear actions
- `TaskHistory` — Completed tasks

### Hooks

- `useServerStatus` — Polls `/api/status` every 2s
- `useTaskEvents` — Subscribes to `/api/events` SSE stream

### API Client

All API calls go through `lib/api.ts`:

- `getStatus()` — Server status
- `getTasks()` — Pending tasks
- `getHistory()` — Completed tasks
- `clearTasks()` — Delete all pending
- `deleteTask(id)` — Delete specific task
- `subscribeToEvents(callback)` — SSE subscription

## Styling

Uses CSS variables for theming with automatic dark mode support:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #212529;
    --text-primary: #f8f9fa;
    /* ... */
  }
}
```

## Testing

```bash
npm test
```

Tests use Vitest + Testing Library.

## License

MIT
