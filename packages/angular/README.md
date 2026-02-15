# @clens/angular

> Angular debug API wrapper and component resolution for clens

This package wraps `@clens/lens` with an Angular-specific component resolver that uses Angular's debug utilities (`window.ng`) to extract component information.

**User-facing documentation:** See [docs/integration.md#angular](../../docs/integration.md#angular) and [docs/quickstart.md](../../docs/quickstart.md)

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
# Terminal 1: Watch Angular adapter
npm run dev

# Terminal 2: Watch lens (dependency)
npm run dev -w @clens/lens

# Terminal 3: Run Angular example
npm run dev -w example-angular
```

Changes to Angular adapter source will trigger rebuilds. Refresh the browser to see updates.

---

## Package Structure

```
packages/angular/
├── src/
│   ├── angular-resolver.ts  # window.ng API wrapper
│   └── index.ts             # Wrapper for lens
├── package.json
└── tsconfig.json
```

---

## How It Works

### Angular Debug API

Angular exposes debug utilities via `window.ng` in development mode:

- `ng.getComponent(element)` — Get component instance mounted on element
- `ng.getOwningComponent(element)` — Get component that owns the element
- `ng.getHostElement(component)` — Get component's host DOM element

**Important:** These APIs are only available when Angular is compiled in development mode.

### Component Metadata

Component metadata is stored at `component.constructor.ɵcmp.debugInfo`:

```typescript
interface AngularDebugInfo {
  className: string; // Component class name
  filePath: string; // Source file path
  lineNumber: number; // Line number in source file
}
```

This information is automatically injected by Angular's compiler in development builds.

### Implementation

**Resolve component info from DOM element:**

```typescript
export function resolveComponentInfo(
  element: HTMLElement
): ComponentInfo | null {
  const ng = (window as any).ng;
  if (!ng) return null;

  // Try to get the component on this element first, then owning component
  let component = ng.getComponent(element) ?? ng.getOwningComponent(element);
  if (!component) return null;

  // Compute relative DOM path from the component's host element to the target
  const hostElement: HTMLElement | null =
    ng.getHostElement?.(component) ?? null;
  const childPath = hostElement
    ? computeChildPath(hostElement, element)
    : undefined;

  const { className, filePath, lineNumber } = component.constructor.ɵcmp
    .debugInfo as AngularDebugInfo;

  return {
    name: className,
    file: filePath,
    line: lineNumber,
    childPath,
  };
}
```

**Compute child path:**

Uses `computeChildPath` from `@clens/lens` to generate a relative CSS selector:

```typescript
import { computeChildPath } from "@clens/lens";

const hostElement = ng.getHostElement(component);
const childPath = computeChildPath(hostElement, element);
// Example: "div > ul > li:nth-of-type(2)"
```

This helps the AI agent understand which specific element within a component was clicked.

---

## API

### enableInspectorOverlay

```typescript
import { enableInspectorOverlay } from "@clens/angular";

// Enable with defaults
enableInspectorOverlay();

// Enable with custom config
enableInspectorOverlay({
  serverUrl: "http://localhost:3100",
  token: "your-auth-token",
});
```

This is a thin wrapper around `@clens/lens`'s `enableInspectorOverlay`, passing the Angular resolver:

```typescript
import { enableInspectorOverlay as enableOverlay } from "@clens/lens";
import { resolveComponentInfo } from "./angular-resolver";

export function enableInspectorOverlay(
  config?: Partial<ConnectionConfig>
): void {
  enableOverlay(resolveComponentInfo, config);
}
```

---

## Requirements

### Vite Plugin

Angular requires the Analog.js Vite plugin for Vite builds:

```bash
npm install -D @analogjs/vite-plugin-angular
```

```typescript
// vite.config.ts
import angular from "@analogjs/vite-plugin-angular";

export default {
  plugins: [angular()],
};
```

### Development Mode

Angular's debug APIs and metadata are only available in development mode. Ensure you're running a dev build:

```bash
npm run dev
```

In production builds, `window.ng` is stripped out for performance and bundle size.

---

## Dependencies

- **@clens/lens** — Core overlay UI and services
- **react** and **react-dom** (peer dependencies, used by lens)

**Note:** While Angular itself doesn't use React, the clens overlay UI is built with React. This doesn't affect Angular's runtime or bundle.

---

## Angular Version Support

Tested with Angular 15+. Earlier versions may work but are untested.

The `window.ng` API has been stable since Angular 9, but the structure of `debugInfo` may vary between versions.

---

## Debugging

Check if Angular debug utilities are available:

```typescript
if (import.meta.env.DEV) {
  console.log("ng available:", !!(window as any).ng);
  console.log("getComponent:", (window as any).ng?.getComponent);
  console.log("getOwningComponent:", (window as any).ng?.getOwningComponent);
}
```

Log component info for debugging:

```typescript
const element = document.querySelector(".my-component");
const ng = (window as any).ng;
const component = ng.getComponent(element);
console.log("Component:", component);
console.log("Debug info:", component?.constructor?.ɵcmp?.debugInfo);
```

---

## Limitations

### Production Builds

The resolver will not work in production builds because:

- `window.ng` is not available
- `debugInfo` is stripped from component metadata

**Recommendation:** Only enable the overlay in development:

```typescript
if (import.meta.env.DEV) {
  enableInspectorOverlay();
}
```

### Component Detection

The resolver tries two methods to find the component:

1. `ng.getComponent(element)` — Component mounted directly on this element
2. `ng.getOwningComponent(element)` — Component that owns this element

If neither finds a component, the resolver returns `null` and no tooltip appears.

This can happen with:

- Elements not managed by Angular (e.g., static HTML)
- Directives without a component
- Elements rendered by third-party libraries

---

## Next Steps

- [**Integration Guide**](../../docs/integration.md#angular) — Angular-specific setup
- [**How It Works**](../../docs/how-it-works.md#angular-debug-api) — Detailed Angular resolver explanation
- [**Development Guide**](../../docs/development.md) — Monorepo development workflow
