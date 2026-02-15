# API Reference

Complete reference for clens MCP tools and HTTP endpoints.

---

## MCP Tools

These tools are available to AI agents (Cursor, etc.) via the Model Context Protocol.

### WaitForTask

Blocks until a pending task is submitted from the browser overlay. Does not change task status.

**Parameters:**

| Name      | Type     | Required | Description                           |
| --------- | -------- | -------- | ------------------------------------- |
| `timeout` | `number` | No       | Maximum seconds to wait (default: 30) |

**Response:**

Returns task details if available, or a timeout message.

**Success:**

```
New task available:

  ID:         a1b2c3d4-e5f6-7890-abcd-ef1234567890
  Text:       Make this button green
  Component:  TodoItem
  Element:    button.delete
  Child path: div > button
  File:       src/components/TodoItem.tsx:42
  Submitted:  2026-02-15T10:30:00.000Z

Pending tasks in queue: 1
```

**Timeout:**

```
No task arrived within 30s. Call again to keep waiting.
```

**Example:**

```typescript
const task = await WaitForTask({ timeout: 30 });
```

---

### ListTasks

Lists all tasks, optionally filtered by status.

**Parameters:**

| Name     | Type                                                | Required | Description                                      |
| -------- | --------------------------------------------------- | -------- | ------------------------------------------------ |
| `status` | `"pending" \| "ongoing" \| "completed" \| "failed"` | No       | Filter tasks by status. If omitted, returns all. |

**Response:**

Returns a formatted list of tasks.

**Example output:**

```
3 tasks found:

[pending] | a1b2c3d4-... | Make this button green
             Component: TodoItem > button.delete (div > button)
             Submitted: 2026-02-15T10:30:00.000Z

[ongoing] | b2c3d4e5-... | Add loading spinner
             Component: AddButton > button.add (button)
             Submitted: 2026-02-15T10:28:00.000Z | Started: 2026-02-15T10:29:00.000Z

[completed] | c3d4e5f6-... | Fix typo in header
             Component: Header > h1 (h1)
             Submitted: 2026-02-15T10:25:00.000Z | Started: 2026-02-15T10:26:00.000Z | Completed: 2026-02-15T10:27:00.000Z
             Result: Changed "Helllo" to "Hello"
```

**Example:**

```typescript
// List all tasks
const allTasks = await ListTasks();

// List only pending tasks
const pendingTasks = await ListTasks({ status: "pending" });
```

---

### GetTask

Returns details of a single task by ID.

**Parameters:**

| Name | Type     | Required | Description |
| ---- | -------- | -------- | ----------- |
| `id` | `string` | Yes      | Task ID     |

**Response:**

Returns detailed task information.

**Example output:**

```
Task a1b2c3d4-e5f6-7890-abcd-ef1234567890:

  Status:     ongoing
  Text:       Make this button green
  Component:  TodoItem
  Element:    button.delete
  Child path: div > button
  File:       src/components/TodoItem.tsx:42
  Submitted:  2026-02-15T10:30:00.000Z
  Started:    2026-02-15T10:31:00.000Z
```

**Error (404):**

```
Task not found: invalid-id-12345
```

**Example:**

```typescript
const task = await GetTask({ id: "a1b2c3d4-..." });
```

---

### StartTask

Marks a pending task as ongoing. Transitions status from `"pending"` to `"ongoing"`.

**Parameters:**

| Name | Type     | Required | Description |
| ---- | -------- | -------- | ----------- |
| `id` | `string` | Yes      | Task ID     |

**Response:**

Confirms the task has been started.

**Success:**

```
Task a1b2c3d4-... is now ongoing.

  Text:       Make this button green
  Started at: 2026-02-15T10:31:00.000Z
```

**Error (not found):**

```
Task not found: invalid-id-12345
```

**Error (wrong status):**

```
Cannot start task a1b2c3d4-...: current status is 'completed' (expected 'pending').
```

**Example:**

```typescript
await StartTask({ id: "a1b2c3d4-..." });
```

---

### CompleteTask

Marks an ongoing task as completed. Transitions status from `"ongoing"` to `"completed"`.

**Parameters:**

| Name     | Type     | Required | Description                       |
| -------- | -------- | -------- | --------------------------------- |
| `id`     | `string` | Yes      | Task ID                           |
| `result` | `string` | No       | Optional summary of what was done |

**Response:**

Confirms the task has been completed.

**Success:**

```
Task a1b2c3d4-... completed.

  Text:         Make this button green
  Result:       Changed button background to #00ff00
  Completed at: 2026-02-15T10:32:00.000Z
  Duration:     1m 30s
```

**Error (not found):**

```
Task not found: invalid-id-12345
```

**Error (wrong status):**

```
Cannot complete task a1b2c3d4-...: current status is 'pending' (expected 'ongoing').
```

**Example:**

```typescript
await CompleteTask({
  id: "a1b2c3d4-...",
  result: "Changed button background to #00ff00",
});
```

---

### FailTask

Marks an ongoing task as failed. Transitions status from `"ongoing"` to `"failed"`.

**Parameters:**

| Name     | Type     | Required | Description             |
| -------- | -------- | -------- | ----------------------- |
| `id`     | `string` | Yes      | Task ID                 |
| `reason` | `string` | No       | Optional failure reason |

**Response:**

Confirms the task has been marked as failed.

**Success:**

```
Task a1b2c3d4-... marked as failed.

  Text:      Make this button green
  Reason:    File not found: src/components/TodoItem.tsx
  Failed at: 2026-02-15T10:32:00.000Z
```

**Error (not found):**

```
Task not found: invalid-id-12345
```

**Error (wrong status):**

```
Cannot fail task a1b2c3d4-...: current status is 'pending' (expected 'ongoing').
```

**Example:**

```typescript
await FailTask({
  id: "a1b2c3d4-...",
  reason: "File not found",
});
```

---

## HTTP Endpoints

All endpoints require authentication if `MCP_AUTH_TOKEN` is set.

### Authentication

**Header:**

```
Authorization: Bearer your-secret-token
```

**Status Codes:**

- `401 Unauthorized` — Missing or invalid token
- `403 Forbidden` — Valid token but insufficient permissions

---

### POST /task

Submit a task from the browser overlay.

**Request Body:**

```json
{
  "text": "Make this button green",
  "component": {
    "name": "TodoItem",
    "file": "src/components/TodoItem.tsx",
    "line": 42,
    "childPath": "div > button",
    "element": "button.delete"
  }
}
```

**Response (200 OK):**

```json
{
  "ok": true,
  "queued": 1,
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response (400 Bad Request):**

```json
{
  "error": "Missing required field: text"
}
```

**Example:**

```bash
curl -X POST http://localhost:3100/task \
  -H "Content-Type: application/json" \
  -d '{"text":"Make this button green"}'
```

---

### GET /health

Health check endpoint.

**Response (200 OK):**

```json
{
  "status": "ok",
  "pending": 2,
  "authenticated": false
}
```

**Fields:**

- `status` — Always `"ok"` if server is running
- `pending` — Number of pending tasks in queue
- `authenticated` — Whether authentication is enabled

**Example:**

```bash
curl http://localhost:3100/health
```

---

### GET /api/status

Server status for dashboard.

**Response (200 OK):**

```json
{
  "uptime": 123456,
  "transport": "stdio",
  "port": 3100,
  "queueSize": 2,
  "activeSseSessions": 1
}
```

**Fields:**

- `uptime` — Server uptime in seconds
- `transport` — MCP transport mode (`"stdio"` or `"sse"`)
- `port` — HTTP server port
- `queueSize` — Total tasks in queue (all statuses)
- `activeSseSessions` — Number of active SSE connections (dashboard + MCP clients)

**Example:**

```bash
curl http://localhost:3100/api/status
```

---

### GET /api/tasks

List all pending tasks in the queue.

**Response (200 OK):**

```json
{
  "tasks": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "text": "Make this button green",
      "timestamp": "2026-02-15T10:30:00.000Z",
      "status": "pending",
      "component": {
        "name": "TodoItem",
        "file": "src/components/TodoItem.tsx",
        "line": 42,
        "childPath": "div > button",
        "element": "button.delete"
      }
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:3100/api/tasks
```

---

### GET /api/tasks/history

List recently completed tasks (last 50).

**Response (200 OK):**

```json
{
  "history": [
    {
      "id": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
      "text": "Fix typo in header",
      "timestamp": "2026-02-15T10:25:00.000Z",
      "status": "completed",
      "startedAt": "2026-02-15T10:26:00.000Z",
      "completedAt": "2026-02-15T10:27:00.000Z",
      "result": "Changed 'Helllo' to 'Hello'",
      "component": {
        "name": "Header",
        "file": "src/components/Header.tsx",
        "line": 5
      }
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:3100/api/tasks/history
```

---

### DELETE /api/tasks

Clear all pending tasks from the queue.

**Response (200 OK):**

```json
{
  "ok": true
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3100/api/tasks
```

---

### DELETE /api/tasks/:id

Remove a specific task by its ID.

**Response (200 OK):**

```json
{
  "ok": true
}
```

**Response (404 Not Found):**

```json
{
  "error": "Task not found"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3100/api/tasks/a1b2c3d4-...
```

---

### GET /api/events

Server-Sent Events (SSE) stream for real-time dashboard updates.

**Response:**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Types:**

- `connected` — Initial connection established
- `task_enqueued` — New task added to queue
- `task_dequeued` — Task moved from pending to ongoing
- `task_deleted` — Task manually deleted
- `queue_cleared` — All tasks cleared

**Example Event:**

```
event: task_enqueued
data: {"type":"task_enqueued","task":{"id":"a1b2c3d4-...","text":"Make this button green","timestamp":"2026-02-15T10:30:00.000Z","status":"pending"}}

event: task_dequeued
data: {"type":"task_dequeued","task":{"id":"a1b2c3d4-...","text":"Make this button green","timestamp":"2026-02-15T10:30:00.000Z","status":"ongoing","startedAt":"2026-02-15T10:31:00.000Z"}}
```

**Example (JavaScript):**

```javascript
const eventSource = new EventSource("http://localhost:3100/api/events");

eventSource.addEventListener("task_enqueued", (event) => {
  const data = JSON.parse(event.data);
  console.log("New task:", data.task);
});

eventSource.addEventListener("task_dequeued", (event) => {
  const data = JSON.parse(event.data);
  console.log("Task started:", data.task);
});
```

---

### GET /dashboard

Serve the dashboard UI (static HTML/CSS/JS).

**Response:**

Returns the dashboard HTML page.

**Access:**

```
http://localhost:3100/dashboard
```

---

### GET /sse

MCP transport over Server-Sent Events.

**Response:**

SSE stream for MCP protocol messages.

**Used by Cursor when configured with:**

```json
{
  "mcpServers": {
    "clens": {
      "url": "http://localhost:3100/sse"
    }
  }
}
```

---

## Task Object Schema

```typescript
interface BrowserTask {
  id: string; // Unique task ID (UUID v4)
  text: string; // Task description
  timestamp: string; // ISO 8601 submission time
  status: "pending" | "ongoing" | "completed" | "failed"; // Task status
  component?: {
    // Optional component info
    name: string; // Component name
    file?: string; // Source file path
    line?: number; // Line number
    childPath?: string; // Relative DOM path
    element?: string; // Element identifier
  };
  startedAt?: string; // ISO 8601 time when task was started
  completedAt?: string; // ISO 8601 time when task completed/failed
  result?: string; // Completion result or failure reason
}
```

---

## Error Responses

All endpoints may return these error codes:

| Code | Meaning        | Response Body                |
| ---- | -------------- | ---------------------------- |
| 400  | Bad Request    | `{"error":"Invalid JSON"}`   |
| 401  | Unauthorized   | `{"error":"Unauthorized"}`   |
| 404  | Not Found      | `{"error":"Task not found"}` |
| 500  | Internal Error | `{"error":"Internal error"}` |

---

## Rate Limiting

No rate limiting is currently implemented. This may be added in a future release.

---

## Next Steps

- [**Quickstart**](quickstart.md) — Get started with clens
- [**Configuration**](configuration.md) — Environment variables and Cursor setup
- [**How It Works**](how-it-works.md) — Architecture and data flow
