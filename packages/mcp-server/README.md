# @clens/mcp-server

> MCP server with HTTP API, task queue, and dashboard

This package provides the Node.js server that receives tasks from the browser overlay and exposes them to AI agents via the Model Context Protocol. It also serves the dashboard UI and provides an HTTP API for task management.

**User-facing documentation:** See [docs/quickstart.md](../../docs/quickstart.md), [docs/configuration.md](../../docs/configuration.md), and [docs/api-reference.md](../../docs/api-reference.md)

---

## Development

### Build

```bash
# Build once
npm run build

# Watch mode (restarts on changes via tsx)
npm run dev
```

Output: `dist/` (CommonJS via tsdown)

The build process also compiles the dashboard UI (from `@clens/dashboard`) and bundles it for serving at `/dashboard`.

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
```

---

## Package Structure

```
packages/mcp-server/
├── src/
│   ├── endpoints/               # HTTP route handlers
│   │   ├── api/                 # REST API endpoints
│   │   │   ├── events.ts        # GET /api/events (SSE)
│   │   │   ├── status.ts        # GET /api/status
│   │   │   └── tasks.ts         # GET/DELETE /api/tasks
│   │   ├── dashboard/           # Dashboard UI serving
│   │   │   └── serve.ts         # GET /dashboard
│   │   ├── health.ts            # GET /health
│   │   ├── sse.ts               # GET /sse (MCP over SSE)
│   │   └── task.ts              # POST /task
│   ├── lib/                     # Shared utilities
│   │   ├── config.ts            # Environment variables
│   │   ├── http.ts              # HTTP server factory
│   │   └── listen.ts            # MCP transport setup
│   ├── mcp/                     # MCP server
│   │   └── server.ts            # Tool registration
│   ├── middleware/              # HTTP middleware
│   │   ├── auth.ts              # Bearer token auth
│   │   ├── cors.ts              # CORS headers
│   │   └── logger.ts            # Request logging
│   ├── state/                   # In-memory state
│   │   ├── task-store.ts        # Task queue
│   │   └── sse-connections.ts   # SSE connection manager
│   ├── index.ts                 # Entry point
│   └── types.ts                 # TypeScript types
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

---

## Key Concepts

### Task Queue

Tasks are stored in memory with four states:

- **pending** — Submitted, not yet picked up by agent
- **ongoing** — Agent started working on the task
- **completed** — Agent finished successfully
- **failed** — Agent encountered an error

**State transitions:**

```
pending → ongoing → completed
                 ↘ failed
```

**Implementation:** `src/state/task-store.ts`

Functions:

- `enqueue(task)` — Add a pending task
- `peek()` — View next pending task without removing
- `dequeue()` — Remove and return next pending task
- `findById(id)` — Get task by ID
- `listAll()` — Get all tasks
- `listByStatus(status)` — Filter by status
- `startTask(id)` — Mark as ongoing
- `completeTask(id, result?)` — Mark as completed
- `failTask(id, reason?)` — Mark as failed
- `deleteTask(id)` — Remove a task
- `clearPending()` — Remove all pending tasks
- `waitForTask(timeoutMs)` — Block until a task is available

### MCP Tools

Six tools are exposed to AI agents:

1. **WaitForTask** — Blocks until a pending task is available
2. **ListTasks** — Lists all tasks (optionally filtered by status)
3. **GetTask** — Retrieves a specific task by ID
4. **StartTask** — Marks a pending task as ongoing
5. **CompleteTask** — Marks an ongoing task as completed
6. **FailTask** — Marks an ongoing task as failed

**Implementation:** `src/mcp/server.ts`

Each tool validates input, checks task state, and returns formatted responses.

### HTTP Server

Built with Node.js `http` module. Middleware stack:

1. **CORS** — Allow cross-origin requests
2. **Logger** — Log incoming requests
3. **Auth** — Verify Bearer token (if `MCP_AUTH_TOKEN` is set)
4. **Routes** — Dispatch to endpoint handlers

**Implementation:** `src/lib/http.ts`

### SSE Connections

Server-Sent Events (SSE) are used for:

- Dashboard real-time updates (`GET /api/events`)
- MCP transport over HTTP (`GET /sse`)

**Implementation:** `src/state/sse-connections.ts`

Functions:

- `add(response)` — Register a new SSE connection
- `remove(response)` — Cleanup on disconnect
- `broadcast(event)` — Send event to all connected clients
- `count()` — Get number of active connections

### Environment Variables

Configured via `.env` or shell environment:

| Variable         | Default | Description                           |
| ---------------- | ------- | ------------------------------------- |
| `MCP_HTTP_PORT`  | `3100`  | HTTP server port                      |
| `MCP_TRANSPORT`  | `stdio` | MCP transport mode (`stdio` or `sse`) |
| `MCP_AUTH_TOKEN` | —       | Optional Bearer token for auth        |

**Implementation:** `src/lib/config.ts`

---

## MCP Transport Modes

### stdio (Default)

- Cursor spawns the server as a child process
- Communication over stdin/stdout using JSON-RPC
- Server lifecycle managed by Cursor

**Usage:**

```bash
npx clens-mcp
# or
MCP_TRANSPORT=stdio npx clens-mcp
```

### SSE (Server-Sent Events)

- Server runs independently
- Cursor connects via HTTP to `/sse` endpoint
- Uses SSE for server-to-client messages, POST for client-to-server

**Usage:**

```bash
MCP_TRANSPORT=sse npx clens-mcp
```

**Implementation:** `src/lib/listen.ts`

---

## Endpoint Handlers

### Task Submission

**POST /task** — Submit a task from the browser overlay

```typescript
// src/endpoints/task.ts
export async function handleTaskSubmission(req, res) {
  const body = await parseJsonBody(req);
  const task = {
    id: crypto.randomUUID(),
    text: body.text,
    component: body.component,
    timestamp: new Date().toISOString(),
    status: "pending",
  };
  taskStore.enqueue(task);
  sseConnections.broadcast({ type: "task_enqueued", task });
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, queued: 1, id: task.id }));
}
```

### Health Check

**GET /health** — Health check for overlay connection indicator

```typescript
// src/endpoints/health.ts
export function handleHealthCheck(req, res) {
  const pending = taskStore.listByStatus("pending").length;
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      pending,
      authenticated: !!process.env.MCP_AUTH_TOKEN,
    })
  );
}
```

### Dashboard Serving

**GET /dashboard** — Serve dashboard UI (static files)

```typescript
// src/endpoints/dashboard/serve.ts
export function handleDashboardRequest(req, res) {
  const filePath = getFilePath(req.url);
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { "Content-Type": getMimeType(filePath) });
  stream.pipe(res);
}
```

---

## Testing with Example Apps

```bash
# Terminal 1: Start MCP server in watch mode
npm run dev -w @clens/mcp-server

# Terminal 2: Start React example
npm run dev -w example-react

# Terminal 3: Start dashboard dev server (optional)
npm run dev -w @clens/dashboard
```

Submit tasks from the example app and verify they appear in the dashboard and are accessible via MCP tools.

---

## Debugging

Enable verbose logging:

```bash
DEBUG=* npm run dev -w @clens/mcp-server
```

Check MCP logs in Cursor:

- **Settings** → **MCP** → **View Logs**

Test HTTP endpoints with curl:

```bash
# Health check
curl http://localhost:3100/health

# Submit task
curl -X POST http://localhost:3100/task \
  -H "Content-Type: application/json" \
  -d '{"text":"Test task"}'

# List tasks
curl http://localhost:3100/api/tasks
```

---

## Dependencies

- **@modelcontextprotocol/sdk** — MCP server implementation
- **zod** — Schema validation for tool inputs
- **@clens/dashboard** — Dashboard UI (bundled and served)
- **tsdown** — Bundler for CommonJS output

---

## Next Steps

- [**API Reference**](../../docs/api-reference.md) — HTTP endpoints and MCP tools
- [**Configuration**](../../docs/configuration.md) — Environment variables and Cursor setup
- [**Development Guide**](../../docs/development.md) — Monorepo development workflow
