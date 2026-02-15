# How It Works

This document explains clens's architecture, data flow, and how component resolution works under the hood.

---

## Overview

Clens consists of five packages that work together to bridge your browser and AI agent:

| Package             | Role                                                | Runs Where |
| ------------------- | --------------------------------------------------- | ---------- |
| `@clens/lens`       | Core overlay UI, toolbar, tooltip, HTTP client      | Browser    |
| `@clens/react`      | React fiber traversal and component resolution      | Browser    |
| `@clens/angular`    | Angular debug API wrapper and component resolution  | Browser    |
| `@clens/mcp-server` | HTTP server, task queue, MCP tools, SSE connections | Node.js    |
| `@clens/dashboard`  | Real-time monitoring UI for task queue and server   | Browser    |

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

---

## Data Flow

### 1. User Clicks an Element

1. User clicks the **Inspect** button in the toolbar
2. User hovers over an element → highlight overlay appears
3. User clicks the element → tooltip opens

### 2. Component Resolution

**React:**

- Get the React fiber node from the DOM element (`__reactFiber$...`)
- Walk up the fiber tree to find the nearest function component
- Extract source info from `_debugSource` (React <19) or `_debugStack` (React 19+)
- Compute relative DOM path from component root to clicked element
- Return `{ name, file, line, childPath }`

**Angular:**

- Access `window.ng.getComponent()` or `window.ng.getOwningComponent()`
- Read debug info from `component.constructor.ɵcmp.debugInfo`
- Extract `{ className, filePath, lineNumber }`
- Compute relative DOM path from host element to clicked element
- Return `{ name, file, line, childPath }`

See [`packages/react/src/fiber.ts`](../packages/react/src/fiber.ts) and [`packages/angular/src/angular-resolver.ts`](../packages/angular/src/angular-resolver.ts) for implementation details.

### 3. Task Submission

1. User types a task in the tooltip input (e.g., "Make this button green")
2. Lens sends `POST /task` to the MCP server with:
   ```json
   {
     "text": "Make this button green",
     "component": {
       "name": "TodoItem",
       "file": "src/components/TodoItem.tsx",
       "line": 12,
       "childPath": "div > button",
       "element": "button.delete"
     }
   }
   ```
3. MCP server assigns a unique ID and adds it to the in-memory queue with status `"pending"`
4. Server responds with `{ ok: true, queued: 1, id: "..." }`
5. Tooltip shows success feedback

### 4. Task Queue

The MCP server maintains an in-memory task queue with four states:

- **pending** — Task submitted, not yet picked up by agent
- **ongoing** — Agent started working on the task
- **completed** — Agent finished successfully
- **failed** — Agent encountered an error

Tasks flow through this lifecycle:

```
pending → ongoing → completed
                 ↘ failed
```

### 5. AI Agent Workflow

The AI agent (Cursor) uses six MCP tools to interact with the queue:

1. **WaitForTask** — Blocks until a pending task is available (does not change status)
2. **StartTask** — Marks a pending task as ongoing (status: `pending` → `ongoing`)
3. **CompleteTask** — Marks an ongoing task as completed (status: `ongoing` → `completed`)
4. **FailTask** — Marks an ongoing task as failed (status: `ongoing` → `failed`)
5. **ListTasks** — Lists all tasks (optionally filtered by status)
6. **GetTask** — Retrieves a specific task by ID

**Example agent flow:**

```typescript
// 1. Wait for a task
const task = await WaitForTask({ timeout: 30 });
// Returns: { id, text, component: { name, file, line, childPath } }

// 2. Start working on it
await StartTask({ id: task.id });

// 3. Do the work...
// Read file, make changes, etc.

// 4. Mark complete
await CompleteTask({ id: task.id, result: "Changed button color to green" });
```

See [`packages/mcp-server/src/mcp/server.ts`](../packages/mcp-server/src/mcp/server.ts) for tool implementations.

### 6. Real-Time Updates

The dashboard subscribes to `GET /api/events` (Server-Sent Events) for real-time updates:

- `task_enqueued` — New task added to queue
- `task_dequeued` — Task moved from pending to ongoing
- `task_deleted` — Task manually deleted
- `queue_cleared` — All tasks cleared

The dashboard automatically updates its UI when these events arrive.

---

## Component Resolution Deep Dive

### React Fiber Traversal

React's fiber tree is a linked list of objects representing the component hierarchy. Each fiber node has:

- `type` — Component function or DOM tag name
- `stateNode` — DOM element (for host components)
- `return` — Parent fiber
- `child` — First child fiber
- `_debugSource` — Source info (React <19)
- `_debugStack` — Error stack with source info (React 19+)

**Algorithm:**

1. Find the fiber node attached to the DOM element (`Object.keys(dom).find(k => k.startsWith("__reactFiber$"))`)
2. Walk up via `fiber.return` until finding a fiber with `typeof fiber.type === "function"`
3. Extract source info from `_debugSource` or parse `_debugStack` Error object
4. Walk down from component fiber via `fiber.child` to find the first DOM element (component root)
5. Compute CSS selector path from component root to clicked element

**Handling React 19+ Stack Traces:**

React 19 captures component location as an Error stack trace. We parse it with a regex to extract file path and line number:

```javascript
/(?:at\s+(?:[\w$.]+\s+)?\(?|[\w$.]*@)(?:https?:\/\/[^/]+)?(\/[^:?]+)(?:\?[^:]*)?:(\d+):\d+\)?/gm;
```

We skip frames in `node_modules` to find the first user code frame.

### Angular Debug API

Angular provides debug utilities via `window.ng` in development mode:

- `ng.getComponent(element)` — Get component instance mounted on element
- `ng.getOwningComponent(element)` — Get component that owns the element
- `ng.getHostElement(component)` — Get component's host DOM element

Component metadata is stored at `component.constructor.ɵcmp.debugInfo`:

```typescript
{
  className: "TodoItemComponent",
  filePath: "src/app/todo-item.component.ts",
  lineNumber: 15
}
```

This info is only available when Angular is compiled in development mode.

### DOM Path Computation

Both adapters use `computeChildPath(root, target)` from `@clens/lens` to generate a relative CSS selector:

```typescript
computeChildPath(
  document.querySelector(".todo-item"), // root
  document.querySelector(".todo-item button.delete") // target
);
// Returns: "div > button.delete"
```

This helps the AI agent understand which specific element within a component was clicked.

---

## HTTP Server

The MCP server runs an HTTP server (default port 3100) with these endpoints:

| Method | Path                 | Purpose                            |
| ------ | -------------------- | ---------------------------------- |
| POST   | `/task`              | Submit a task from browser         |
| GET    | `/health`            | Health check                       |
| GET    | `/api/status`        | Server status (uptime, queue size) |
| GET    | `/api/tasks`         | List pending tasks                 |
| GET    | `/api/tasks/history` | List completed tasks (last 50)     |
| DELETE | `/api/tasks/:id`     | Delete a specific task             |
| DELETE | `/api/tasks`         | Clear all pending tasks            |
| GET    | `/api/events`        | SSE stream for real-time updates   |
| GET    | `/dashboard`         | Serve dashboard UI                 |
| GET    | `/sse`               | MCP transport over SSE             |

See [API Reference](api-reference.md) for detailed endpoint documentation.

---

## MCP Transport Modes

### stdio (Default)

- Cursor spawns the server as a child process
- Communication over stdin/stdout using JSON-RPC
- Server lifecycle managed by Cursor
- Best for production use

### SSE (Server-Sent Events)

- Server runs independently (you start it manually)
- Cursor connects via HTTP to `/sse` endpoint
- Uses SSE for server-to-client messages, POST for client-to-server
- Best for development (server stays running, easier debugging)

---

## Security

### Optional Authentication

Set `MCP_AUTH_TOKEN` to require Bearer token authentication:

```bash
MCP_AUTH_TOKEN=your-secret-token npx clens-mcp
```

All HTTP endpoints will require:

```
Authorization: Bearer your-secret-token
```

Configure the overlay to send the token:

```typescript
enableInspectorOverlay({
  token: "your-secret-token",
});
```

### CORS

The server allows all origins by default in development. This can be restricted via environment variables if needed.

---

## Performance

### Task Queue

- In-memory storage (no database)
- O(1) enqueue/dequeue operations
- Completed tasks kept in history (max 50, LRU eviction)
- No persistence (tasks lost on server restart)

### SSE Connections

- Dashboard and MCP SSE clients tracked in memory
- Events broadcast to all connected clients
- Automatic cleanup on disconnect

### Health Checks

- Overlay polls `GET /health` every 5 seconds
- Connection indicator updates based on response
- Retries automatically on failure

---

## Browser Compatibility

The overlay uses modern web features:

- **CSS Anchor Positioning API** — For tooltip placement (Chrome 125+, Firefox 129+, Safari 18+)
- **React 19 compatibility** — Supports both old `_debugSource` and new `_debugStack` formats
- **ES Modules** — Requires a bundler (Vite, Webpack, etc.)

Older browsers will see the overlay, but tooltip positioning may be incorrect.

---

## Next Steps

- [**API Reference**](api-reference.md) — Detailed HTTP and MCP tool documentation
- [**Configuration**](configuration.md) — Environment variables and settings
- [**Development**](development.md) — Contributing to clens
