# @clens/lens

> React component inspector overlay for Vite

Browser-side inspector that lets you click any React component to see its name, source file, and line number. Integrates with the clens MCP server to send tasks to AI agents.

## Installation

```bash
npm install @clens/lens
```

## Usage

```typescript
// main.tsx
import { enableInspectorOverlay } from "@clens/lens";

if (import.meta.env.DEV) {
  enableInspectorOverlay();
}
```

### Configuration

```typescript
enableInspectorOverlay({
  serverUrl: "http://localhost:3100", // MCP server URL
  token: "", // Optional auth token
});
```

## Requirements

### Babel Plugin

React needs to provide source information via `@babel/plugin-transform-react-jsx-source`:

```bash
npm install -D @babel/plugin-transform-react-jsx-source
```

```typescript
// vite.config.ts
import react from "@vitejs/plugin-react";

export default {
  plugins: [
    react({
      babel: {
        plugins: ["@babel/plugin-transform-react-jsx-source"],
      },
    }),
  ],
};
```

## Features

- **Draggable Toolbar** — Move it anywhere on the page
- **Inspect Mode** — Hover to highlight components
- **Component Info** — See name, file, line number
- **Task Sending** — Send tasks with component context
- **Connection Status** — Visual indicator of MCP server health
- **Settings Panel** — Configure server URL and auth token

## UI Components

### Toolbar

- Inspect toggle button
- Connection status indicator
- Settings button
- Draggable via background

### Tooltip (appears on element click)

- Component name and location
- Copy button for AI pasting
- Task input field
- Send button

### Settings Panel

- Server URL configuration
- Auth token input
- Test connection button

## How It Works

1. Attaches React fiber traversal to find component info
2. Uses CSS Anchor Positioning API for tooltip placement
3. Sends tasks via `POST /task` to MCP server
4. Polls `GET /health` to check server status

## Browser Support

- Chrome/Edge 125+ (CSS Anchor Positioning)
- Firefox 129+ (CSS Anchor Positioning)
- Safari 18+ (CSS Anchor Positioning)

Older browsers will see the overlay but tooltip positioning may be incorrect.

## Development

```bash
# Watch mode (rebuilds on changes)
npm run dev

# Build
npm run build

# Type-check
npm run typecheck
```

## License

MIT
