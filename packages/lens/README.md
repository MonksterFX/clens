# @clens/lens

> Core browser overlay for component inspection

This package provides the UI foundation for clens: the draggable toolbar, tooltip, settings panel, and component inspection logic. Framework-specific packages (`@clens/react`, `@clens/angular`) wrap this core to provide component resolution.

**User-facing documentation:** See [docs/integration.md](../../docs/integration.md) and [docs/quickstart.md](../../docs/quickstart.md)

---

## Development

### Build

```bash
# Build once
npm run build

# Watch mode (rebuilds on changes)
npm run dev
```

Output: `dist/` (ESM bundle via tsdown)

### Type-check

```bash
npm run typecheck
```

### Testing with Example Apps

```bash
# Terminal 1: Watch lens
npm run dev

# Terminal 2: Run React example
npm run dev -w example-react

# Terminal 3: Run Angular example
npm run dev -w example-angular
```

Changes to lens source will trigger rebuilds. Refresh the browser to see updates.

---

## Package Structure

```
packages/lens/
├── src/
│   ├── ui/                    # UI components
│   │   ├── overlay.tsx        # Main overlay component
│   │   ├── settingsPanel.tsx # Settings panel component
│   │   ├── toolbar/           # Toolbar components
│   │   │   ├── toolbar.tsx
│   │   │   ├── toolbarButton.tsx
│   │   │   └── icons.tsx
│   │   └── tooltip/           # Tooltip components
│   │       ├── tooltip.tsx
│   │       └── tooltipStyles.ts
│   ├── lib/                   # Services and utilities
│   │   ├── config/            # Connection configuration
│   │   │   ├── connection.ts
│   │   │   └── connection.test.ts
│   │   ├── dom/               # DOM utilities
│   │   │   └── childPath.ts  # CSS path computation
│   │   └── services/          # HTTP services
│   │       ├── health.ts      # Health check polling
│   │       └── task.ts        # Task submission
│   ├── index.tsx              # Entry point
│   ├── resolver.ts            # Component resolver registry
│   ├── types.ts               # TypeScript types
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

---

## Key Concepts

### Component Resolver

A `ComponentResolver` is a function that takes a DOM element and returns component information:

```typescript
type ComponentResolver = (element: HTMLElement) => ComponentInfo | null;

interface ComponentInfo {
  name: string;
  file?: string;
  line?: number;
  childPath?: string;
  element?: string;
}
```

Framework-specific packages implement this interface:

- `@clens/react` — Uses React fiber traversal
- `@clens/angular` — Uses `window.ng` debug API

### Entry Point

`enableInspectorOverlay(resolver, config?)` is the main API:

```typescript
export function enableInspectorOverlay(
  resolver: ComponentResolver,
  config?: Partial<ConnectionConfig>
): void {
  // Set the resolver
  setComponentResolver(resolver);

  // Initialize connection config
  if (config) {
    initConfig(config);
  }

  // Mount the overlay
  const container = document.createElement("div");
  container.id = "__clens_inspector_overlay__";
  document.body.appendChild(container);
  createRoot(container).render(<InspectorOverlay />);
}
```

### Connection Configuration

Stored in `localStorage` with defaults:

```typescript
interface ConnectionConfig {
  serverUrl: string; // Default: "http://localhost:3100"
  token: string; // Default: ""
}
```

Users can update via the settings panel (gear icon) or programmatically.

### Services

**Health Check (`lib/services/health.ts`):**

- Polls `GET /health` every 5 seconds
- Updates connection status indicator in toolbar
- Retries automatically on failure

**Task Submission (`lib/services/task.ts`):**

- Sends `POST /task` to MCP server
- Includes component info and task text
- Returns task ID on success

### DOM Path Computation

`computeChildPath(root, target)` generates a relative CSS selector:

```typescript
import { computeChildPath } from "@clens/lens";

const path = computeChildPath(
  document.querySelector(".todo-item"),
  document.querySelector(".todo-item button.delete")
);
// Returns: "div > button.delete"
```

Used by framework adapters to provide context to AI agents.

---

## UI Components

### Overlay

Main component that mounts the toolbar and tooltip.

**State:**

- `inspectMode` — Whether inspect mode is active
- `selectedElement` — Currently selected DOM element
- `tooltipVisible` — Whether tooltip is visible
- `settingsPanelVisible` — Whether settings panel is visible

**Handlers:**

- `handleMouseMove` — Highlight hovered element
- `handleClick` — Select element and show tooltip
- `handleEscape` — Close tooltip or exit inspect mode

### Toolbar

Draggable toolbar with buttons:

- **Inspect** — Toggle inspect mode
- **Connection Status** — Green (connected) / Red (disconnected)
- **Settings** — Open settings panel

**Features:**

- Drag to reposition (stored in `localStorage`)
- Click background to drag
- Click buttons to trigger actions

### Tooltip

Appears when an element is selected. Shows:

- Component name and file location
- Copy button (copies file:line for easy pasting)
- Task input field
- Send button

**Positioning:**

- Uses CSS Anchor Positioning API (Chrome 125+, Firefox 129+, Safari 18+)
- Anchored to the selected element
- Automatically adjusts to stay in viewport

### Settings Panel

Modal for configuring connection:

- Server URL input
- Auth token input
- Test Connection button
- Save/Cancel buttons

Changes are saved to `localStorage`.

---

## Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

Test files live next to source files with `.test.ts` extension.

Example:

```typescript
import { describe, it, expect } from "vitest";
import { getConfig, setConfig } from "./connection";

describe("connection config", () => {
  it("should have default config", () => {
    const config = getConfig();
    expect(config.serverUrl).toBe("http://localhost:3100");
  });
});
```

---

## Dependencies

- **react** and **react-dom** — UI components
- **tsdown** — Bundler for ESM output

---

## Browser Compatibility

- **Chrome/Edge** 125+ — Full support
- **Firefox** 129+ — Full support
- **Safari** 18+ — Full support
- **Older browsers** — Overlay works, but tooltip positioning may be incorrect (CSS Anchor Positioning API not available)

---

## Next Steps

- [**How It Works**](../../docs/how-it-works.md) — Architecture and component resolution
- [**Development Guide**](../../docs/development.md) — Monorepo development workflow
