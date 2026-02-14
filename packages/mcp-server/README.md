# react-visual-debugger-mcp

MCP server for the React Visual Debugger. Exposes a single tool, **TaskFromBrowser**, that lets an AI agent receive tasks submitted from the browser.

## How it works

The server runs two things simultaneously:

1. **stdio MCP transport** — communicates with Cursor (or any MCP client) over stdin/stdout.
2. **HTTP receiver** (default port `3100`) — accepts task submissions from the browser overlay via `POST /task`.

When the React visual debugger overlay submits a task, it is queued in memory. An AI agent can then call `TaskFromBrowser` to dequeue and act on it.

```
Browser overlay ──POST /task──▶ HTTP server ──queue──▶ TaskFromBrowser tool ──▶ AI agent
```

## Setup

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

## MCP tool

### TaskFromBrowser

Returns the next pending task submitted from the browser.

| Parameter | Type    | Required | Description                                              |
| --------- | ------- | -------- | -------------------------------------------------------- |
| `peek`    | boolean | No       | If true, returns the next task without removing it from the queue. |

**Response** — a text content block with the task description, submission timestamp, and remaining queue depth. Returns `"No pending tasks from the browser."` when the queue is empty.

## HTTP endpoints

### `POST /task`

Submit a task from the browser.

```json
{ "text": "Fix the button styling in TodoItem component" }
```

**200 OK**

```json
{ "ok": true, "queued": 1 }
```

### `GET /health`

Health check.

```json
{ "status": "ok", "pending": 0 }
```

## Cursor configuration

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "react-visual-debugger": {
      "command": "node",
      "args": ["./mcp/dist/index.js"]
    }
  }
}
```

## Environment variables

| Variable        | Default | Description                        |
| --------------- | ------- | ---------------------------------- |
| `MCP_HTTP_PORT` | `3100`  | Port for the HTTP task receiver.   |
