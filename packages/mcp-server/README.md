# clens-mcp

MCP server for clens. Exposes a single tool, **TaskFromBrowser**, that lets an AI agent receive tasks submitted from the browser.

## How it works

The server runs three things simultaneously:

1. **MCP transport** — communicates with Cursor (or any MCP client) over stdio or SSE.
2. **HTTP receiver** (default port `3100`) — accepts task submissions from the browser overlay via `POST /task`.
3. **Dashboard UI** — web interface for monitoring and managing the task queue at `http://localhost:3100/dashboard`.

When the clens overlay submits a task, it is queued in memory. An AI agent can then call `TaskFromBrowser` to dequeue and act on it. The dashboard provides real-time monitoring via Server-Sent Events (SSE).

```
Browser overlay ──POST /task──▶ HTTP server ──queue──▶ TaskFromBrowser tool ──▶ AI agent
                                      │
                                      └──▶ Dashboard (real-time monitoring)
```

## Setup

```bash
npm install
npm run build
```

The build process will compile both the MCP server and the dashboard UI. The dashboard will be available at `http://localhost:3100/dashboard` when the server is running.

## Development

```bash
npm run dev
```

For dashboard development, you can run the Vite dev server separately:

```bash
cd packages/dashboard
npm run dev
```

This will start the dashboard at `http://localhost:5173` with hot module replacement. Configure the API base URL in development mode to point to `http://localhost:3100`.

## MCP tool

### WaitTaskFromBrowser

Returns the next pending task submitted from the browser.

| Parameter | Type    | Required | Description                                                                 |
| --------- | ------- | -------- | --------------------------------------------------------------------------- |
| `peek`    | boolean | No       | If true, returns the next task without removing it from the queue.          |
| `wait`    | boolean | No       | If true, blocks until a task is available instead of returning immediately. |
| `timeout` | number  | No       | Maximum seconds to wait when `wait` is true. Defaults to 30.                |

**Response** — a text content block with the task description, submission timestamp, and remaining queue depth. Returns `"No pending tasks from the browser."` when the queue is empty (without wait), or `"No task arrived within {timeout}s timeout."` when wait timeout expires.

## HTTP endpoints

### Task submission

#### `POST /task`

Submit a task from the browser.

**Request:**

```json
{ "text": "Fix the button styling in TodoItem component" }
```

**Response (200 OK):**

```json
{ "ok": true, "queued": 1, "id": "a1b2c3d4-..." }
```

### Health & Status

#### `GET /health`

Health check.

**Response:**

```json
{ "status": "ok", "pending": 0, "authenticated": false }
```

#### `GET /api/status`

Server status for dashboard.

**Response:**

```json
{
  "uptime": 123456,
  "transport": "stdio",
  "port": 3100,
  "queueSize": 2,
  "activeSseSessions": 1
}
```

### Task management

#### `GET /api/tasks`

List all pending tasks in the queue.

**Response:**

```json
{
  "tasks": [
    {
      "id": "a1b2c3d4-...",
      "text": "Fix the button styling",
      "timestamp": "2026-02-14T10:30:00.000Z"
    }
  ]
}
```

#### `GET /api/tasks/history`

List recently completed tasks (last 50).

**Response:**

```json
{
  "history": [
    {
      "id": "a1b2c3d4-...",
      "text": "Fix the button styling",
      "timestamp": "2026-02-14T10:30:00.000Z",
      "completedAt": "2026-02-14T10:31:00.000Z"
    }
  ]
}
```

#### `DELETE /api/tasks`

Clear all pending tasks from the queue.

**Response:**

```json
{ "ok": true }
```

#### `DELETE /api/tasks/:id`

Remove a specific task by its ID.

**Response (200 OK):**

```json
{ "ok": true }
```

**Response (404 Not Found):**

```json
{ "error": "Task not found" }
```

### Real-time updates

#### `GET /api/events`

Server-Sent Events (SSE) stream for real-time dashboard updates.

**Event types:**

- `connected` — Initial connection established
- `task_enqueued` — New task added to queue
- `task_dequeued` — Task removed and completed
- `task_deleted` — Task manually deleted
- `queue_cleared` — All tasks cleared

**Example event:**

```
data: {"type":"task_enqueued","task":{"id":"...","text":"...","timestamp":"..."}}
```

### Dashboard UI

#### `GET /dashboard`

Web interface for monitoring and managing tasks. Access at `http://localhost:3100/dashboard`.

**Features:**

- Real-time server status (uptime, queue size, SSE sessions)
- Live task queue with individual delete buttons
- Task history (last 50 completed tasks)
- Clear all tasks button
- Automatic updates via SSE

## Cursor configuration

### stdio mode (default)

Cursor spawns the server process and communicates over stdin/stdout:

```json
{
  "mcpServers": {
    "clens": {
      "command": "node",
      "args": ["./mcp/dist/index.js"]
    }
  }
}
```

### SSE mode

Start the server independently with `MCP_TRANSPORT=sse`, then point Cursor at the SSE endpoint:

```bash
MCP_TRANSPORT=sse npm run dev
```

```json
{
  "mcpServers": {
    "clens": {
      "url": "http://localhost:3100/sse"
    }
  }
}
```

## Environment variables

| Variable         | Default | Description                                   |
| ---------------- | ------- | --------------------------------------------- |
| `MCP_HTTP_PORT`  | `3100`  | Port for the HTTP server (tasks + SSE).       |
| `MCP_TRANSPORT`  | `stdio` | MCP transport mode: `stdio` or `sse`.         |
| `MCP_AUTH_TOKEN` | —       | Optional Bearer token for HTTP endpoint auth. |
