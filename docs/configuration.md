# Configuration

This guide covers all configuration options for clens, including environment variables, MCP server settings, Cursor integration, and overlay customization.

---

## Environment Variables

The MCP server supports configuration via environment variables. Copy `.env.example` to `.env` and customize as needed:

```bash
cp .env.example .env
```

### Available Variables

| Variable         | Default | Description                                  |
| ---------------- | ------- | -------------------------------------------- |
| `MCP_HTTP_PORT`  | `3100`  | Port for the HTTP server (tasks + dashboard) |
| `MCP_TRANSPORT`  | `stdio` | MCP transport mode: `stdio` or `sse`         |
| `MCP_AUTH_TOKEN` | —       | Optional Bearer token for endpoint auth      |

### Examples

**Custom port:**

```bash
MCP_HTTP_PORT=4000 npx clens-mcp
```

**SSE mode:**

```bash
MCP_TRANSPORT=sse npx clens-mcp
```

**With authentication:**

```bash
MCP_AUTH_TOKEN=your-secret-token npx clens-mcp
```

**Combined:**

```bash
MCP_HTTP_PORT=4000 MCP_TRANSPORT=sse MCP_AUTH_TOKEN=secret npx clens-mcp
```

---

## Cursor Integration

Cursor connects to the MCP server via two transport modes: **stdio** (default) or **SSE**.

### stdio Mode (Recommended for Production)

Cursor spawns the server as a child process and communicates over stdin/stdout.

**Configuration:**

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "clens": {
      "command": "npx",
      "args": ["clens-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "clens": {
      "command": "clens-mcp"
    }
  }
}
```

**Advantages:**

- Server lifecycle managed by Cursor
- No need to start server manually
- Automatic restart on Cursor restart

**Disadvantages:**

- Harder to debug (no visible stdout)
- Server restarts on every Cursor restart

### SSE Mode (Recommended for Development)

Server runs independently, Cursor connects via HTTP.

**Configuration:**

1. Start the server with SSE transport:

   ```bash
   MCP_TRANSPORT=sse npx clens-mcp
   ```

2. Add to `.cursor/mcp.json`:

   ```json
   {
     "mcpServers": {
       "clens": {
         "url": "http://localhost:3100/sse"
       }
     }
   }
   ```

**Advantages:**

- Server stays running across Cursor restarts
- Easy to see server logs
- Can debug with curl, Postman, etc.

**Disadvantages:**

- Must start server manually
- Port conflicts if already in use

### Restart Cursor

After modifying `.cursor/mcp.json`, **restart Cursor** to apply changes:

- **macOS/Linux:** Cmd+Q, then reopen
- **Windows:** Close all windows, then reopen

---

## Overlay Configuration

The browser overlay can be configured when calling `enableInspectorOverlay()`.

### React

```typescript
import { enableInspectorOverlay } from "@clens/react";

enableInspectorOverlay({
  serverUrl: "http://localhost:3100", // MCP server URL
  token: "", // Optional auth token
});
```

### Angular

```typescript
import { enableInspectorOverlay } from "@clens/angular";

enableInspectorOverlay({
  serverUrl: "http://localhost:3100", // MCP server URL
  token: "", // Optional auth token
});
```

### Custom Framework

```typescript
import { enableInspectorOverlay } from "@clens/lens";
import { myCustomResolver } from "./resolver";

enableInspectorOverlay(myCustomResolver, {
  serverUrl: "http://localhost:3100",
  token: "",
});
```

### Options

| Option      | Type     | Default                   | Description                                      |
| ----------- | -------- | ------------------------- | ------------------------------------------------ |
| `serverUrl` | `string` | `"http://localhost:3100"` | MCP server URL (HTTP endpoint)                   |
| `token`     | `string` | `""`                      | Optional Bearer token for authenticated requests |

---

## Runtime Configuration

The overlay includes a settings panel (gear icon in toolbar) where users can update configuration without reloading:

- **Server URL** — Change the MCP server endpoint
- **Auth Token** — Set or update the authentication token
- **Test Connection** — Verify the server is reachable

Changes are saved to `localStorage` and persist across page reloads.

---

## Authentication

### Server-Side

Enable authentication by setting `MCP_AUTH_TOKEN`:

```bash
MCP_AUTH_TOKEN=your-secret-token npx clens-mcp
```

All HTTP endpoints will require the `Authorization` header:

```
Authorization: Bearer your-secret-token
```

Requests without the token will receive `401 Unauthorized`.

### Client-Side

Configure the overlay to send the token:

```typescript
enableInspectorOverlay({
  serverUrl: "http://localhost:3100",
  token: "your-secret-token",
});
```

The overlay will include the token in all HTTP requests.

---

## CORS Configuration

The MCP server allows all origins by default in development mode.

**Default behavior:**

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

To restrict origins, set `CORS_ORIGIN` (not implemented yet, but can be added if needed).

---

## Dashboard Configuration

The dashboard is served at `/dashboard` by the MCP server. No additional configuration is needed.

Access: `http://localhost:3100/dashboard`

### Development Mode

When developing the dashboard with Vite dev server:

```bash
npm run dev -w @clens/dashboard
```

The dev server runs on port 5173 and proxies API calls to the MCP server:

```typescript
// packages/dashboard/vite.config.ts
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

---

## Custom Port Examples

### Scenario: Port 3100 Already in Use

**Start server on port 4000:**

```bash
MCP_HTTP_PORT=4000 npx clens-mcp
```

**Update overlay config:**

```typescript
enableInspectorOverlay({
  serverUrl: "http://localhost:4000",
});
```

**Update Cursor config (.cursor/mcp.json):**

SSE mode:

```json
{
  "mcpServers": {
    "clens": {
      "url": "http://localhost:4000/sse"
    }
  }
}
```

stdio mode (pass env var):

```json
{
  "mcpServers": {
    "clens": {
      "command": "npx",
      "args": ["clens-mcp"],
      "env": {
        "MCP_HTTP_PORT": "4000"
      }
    }
  }
}
```

---

## Example Configurations

### Development Setup

**`.env`:**

```bash
MCP_HTTP_PORT=3100
MCP_TRANSPORT=sse
# No auth token
```

**Start server:**

```bash
npm run dev -w @clens/mcp-server
```

**`.cursor/mcp.json`:**

```json
{
  "mcpServers": {
    "clens": {
      "url": "http://localhost:3100/sse"
    }
  }
}
```

**Overlay:**

```typescript
enableInspectorOverlay(); // Uses defaults
```

### Production Setup

**`.env`:**

```bash
MCP_HTTP_PORT=3100
MCP_TRANSPORT=stdio
MCP_AUTH_TOKEN=prod-secret-token-12345
```

**`.cursor/mcp.json`:**

```json
{
  "mcpServers": {
    "clens": {
      "command": "npx",
      "args": ["clens-mcp"],
      "env": {
        "MCP_AUTH_TOKEN": "prod-secret-token-12345"
      }
    }
  }
}
```

**Overlay:**

```typescript
enableInspectorOverlay({
  token: "prod-secret-token-12345",
});
```

### Multiple Projects

If you have multiple projects using clens, run each server on a different port:

**Project A (port 3100):**

```bash
MCP_HTTP_PORT=3100 npx clens-mcp
```

**Project B (port 3101):**

```bash
MCP_HTTP_PORT=3101 npx clens-mcp
```

Configure each overlay accordingly:

```typescript
// Project A
enableInspectorOverlay({ serverUrl: "http://localhost:3100" });

// Project B
enableInspectorOverlay({ serverUrl: "http://localhost:3101" });
```

Configure Cursor to use different MCP server names:

```json
{
  "mcpServers": {
    "clens-project-a": {
      "url": "http://localhost:3100/sse"
    },
    "clens-project-b": {
      "url": "http://localhost:3101/sse"
    }
  }
}
```

---

## Troubleshooting

### Connection Indicator Shows "Disconnected"

1. Verify the MCP server is running:

   ```bash
   curl http://localhost:3100/health
   ```

   Should return: `{"status":"ok","pending":0,"authenticated":false}`

2. Check browser console for errors (CORS, network, etc.)

3. Verify `serverUrl` matches the actual server URL

4. If using auth, verify the token is correct

### Tasks Don't Appear in Cursor

1. Check `.cursor/mcp.json` syntax (valid JSON)

2. Verify transport mode matches:
   - stdio: `command` and `args`
   - SSE: `url` ending with `/sse`

3. Restart Cursor after config changes

4. Check Cursor's MCP logs: **Settings** → **MCP** → **View Logs**

### Port Conflicts

Kill the process using the port:

```bash
# macOS/Linux
lsof -ti:3100 | xargs kill -9

# Windows
netstat -ano | findstr :3100
taskkill /PID <PID> /F
```

Or use a different port (see "Custom Port Examples" above).

---

## Next Steps

- [**API Reference**](api-reference.md) — HTTP endpoints and MCP tools
- [**Quickstart**](quickstart.md) — Getting started guide
- [**How It Works**](how-it-works.md) — Architecture and data flow
