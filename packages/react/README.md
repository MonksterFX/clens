# @clens/react

> React fiber traversal and component resolution for clens

This package wraps `@clens/lens` with a React-specific component resolver that uses React's internal fiber tree to extract component information.

**User-facing documentation:** See [docs/integration.md#react](../../docs/integration.md#react) and [docs/quickstart.md](../../docs/quickstart.md)

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

### Testing with Example App

```bash
# Terminal 1: Watch React adapter
npm run dev

# Terminal 2: Watch lens (dependency)
npm run dev -w @clens/lens

# Terminal 3: Run React example
npm run dev -w example-react
```

Changes to React adapter source will trigger rebuilds. Refresh the browser to see updates.

---

## Package Structure

```
packages/react/
├── src/
│   ├── fiber.ts        # React fiber traversal and resolution
│   └── index.ts        # Wrapper for lens
├── package.json
└── tsconfig.json
```

---

## How It Works

### Fiber Traversal

React's fiber tree is an internal data structure representing the component hierarchy. Each fiber node contains:

- `type` — Component function or DOM tag name
- `stateNode` — DOM element (for host components)
- `return` — Parent fiber
- `child` — First child fiber
- `_debugSource` — Source info (React <19)
- `_debugStack` — Error stack with source info (React 19+)

**Algorithm:**

1. Get the fiber node attached to the DOM element
2. Walk up the fiber tree to find the nearest function component
3. Extract source info from `_debugSource` or `_debugStack`
4. Walk down to find the component's root DOM element
5. Compute a relative CSS selector path from root to clicked element

### Implementation

**Get React fiber from DOM element:**

```typescript
export function getReactFiber(dom: HTMLElement) {
  const key = Object.keys(dom).find((k) => k.startsWith("__reactFiber$"));
  return key ? (dom as any)[key] : null;
}
```

**Find nearest function component:**

```typescript
export function findOwnerComponentFiber(fiber: any) {
  let current = fiber;
  while (current) {
    if (typeof current.type === "function") {
      return current;
    }
    current = current.return;
  }
  return null;
}
```

**Extract source info:**

```typescript
// React <19: source info is directly on fiber
const source = fiber._debugSource;
if (source) {
  return {
    name: owner.type?.name ?? "Anonymous",
    file: source.fileName,
    line: source.lineNumber,
    childPath,
  };
}

// React 19+: source info is captured as an Error stack trace
const parsed = parseDebugStack(fiber._debugStack);
return {
  name: owner.type?.name ?? "Anonymous",
  file: parsed?.fileName,
  line: parsed?.lineNumber,
  childPath,
};
```

**Parse React 19+ stack traces:**

React 19 captures component location as an Error stack. We parse it to extract file path and line number, skipping frames in `node_modules`:

```typescript
function parseDebugStack(
  debugStack: unknown
): { fileName: string; lineNumber: number } | null {
  if (!debugStack || typeof debugStack !== "object") return null;

  const stack = (debugStack as Error).stack;
  if (typeof stack !== "string") return null;

  // Regex matches V8/Chrome and Firefox/Safari stack formats
  const frameRegex =
    /(?:at\s+(?:[\w$.]+\s+)?\(?|[\w$.]*@)(?:https?:\/\/[^/]+)?(\/[^:?]+)(?:\?[^:]*)?:(\d+):\d+\)?/gm;

  let match: RegExpExecArray | null;
  while ((match = frameRegex.exec(stack)) !== null) {
    const filePath = match[1];
    const lineNumber = parseInt(match[2], 10);

    // Skip React internals and dependencies
    if (filePath.includes("node_modules")) continue;

    return { fileName: filePath, lineNumber };
  }

  return null;
}
```

**Compute child path:**

Uses `computeChildPath` from `@clens/lens` to generate a relative CSS selector:

```typescript
import { computeChildPath } from "@clens/lens";

const rootDom = findComponentRootDom(owner);
const childPath = rootDom ? computeChildPath(rootDom, dom) : undefined;
```

This helps the AI agent understand which specific element within a component was clicked.

### Full Resolver

```typescript
export function resolveComponentInfo(dom: HTMLElement): ComponentInfo | null {
  const fiber = getReactFiber(dom);
  if (!fiber) return null;

  const owner = findOwnerComponentFiber(fiber);
  if (!owner) return null;

  // Compute relative DOM path from component root to clicked element
  const rootDom = findComponentRootDom(owner);
  const childPath = rootDom ? computeChildPath(rootDom, dom) : undefined;

  // Extract source info (React <19 or React 19+)
  const source = fiber._debugSource;
  if (source) {
    return {
      name: owner.type?.name ?? "Anonymous",
      file: source.fileName,
      line: source.lineNumber,
      childPath,
    };
  }

  const parsed = parseDebugStack(fiber._debugStack);
  return {
    name: owner.type?.name ?? "Anonymous",
    file: parsed?.fileName,
    line: parsed?.lineNumber,
    childPath,
  };
}
```

---

## API

### enableInspectorOverlay

```typescript
import { enableInspectorOverlay } from "@clens/react";

// Enable with defaults
enableInspectorOverlay();

// Enable with custom config
enableInspectorOverlay({
  serverUrl: "http://localhost:3100",
  token: "your-auth-token",
});
```

This is a thin wrapper around `@clens/lens`'s `enableInspectorOverlay`, passing the React fiber resolver:

```typescript
import { enableInspectorOverlay as enableOverlay } from "@clens/lens";
import { resolveComponentInfo } from "./fiber";

export function enableInspectorOverlay(
  config?: Partial<ConnectionConfig>
): void {
  enableOverlay(resolveComponentInfo, config);
}
```

---

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

Without this plugin, `_debugSource` will be undefined and React 19+ will not capture stack traces.

---

## Dependencies

- **@clens/lens** — Core overlay UI and services
- **react** and **react-dom** (peer dependencies)

---

## React Version Support

- **React 16-18:** Uses `_debugSource` for source info
- **React 19+:** Parses `_debugStack` Error object for source info

Both versions are supported by the resolver.

---

## Debugging

Enable React DevTools to inspect fiber tree:

```typescript
if (import.meta.env.DEV) {
  // Log fiber info for debugging
  const fiber = getReactFiber(element);
  console.log("Fiber:", fiber);
  console.log("Owner:", findOwnerComponentFiber(fiber));
}
```

---

## Next Steps

- [**Integration Guide**](../../docs/integration.md#react) — React-specific setup
- [**How It Works**](../../docs/how-it-works.md#react-fiber-traversal) — Detailed fiber traversal explanation
- [**Development Guide**](../../docs/development.md) — Monorepo development workflow
