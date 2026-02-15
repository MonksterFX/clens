# Integration Guide

This guide provides detailed integration instructions for each supported framework, plus guidance for adding clens support to other frameworks.

---

## React

### Installation

```bash
npm install @clens/react
```

### Setup

1. **Enable the overlay** in your entry point:

```typescript
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";
import { enableInspectorOverlay } from "@clens/react";

// Enable in development only
if (import.meta.env.DEV) {
  enableInspectorOverlay();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

2. **Configure Vite** to include React source information:

Install the Babel plugin:

```bash
npm install -D @babel/plugin-transform-react-jsx-source
```

Update your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["@babel/plugin-transform-react-jsx-source"],
      },
    }),
  ],
});
```

### Configuration Options

```typescript
enableInspectorOverlay({
  serverUrl: "http://localhost:3100", // MCP server URL (default)
  token: "", // Optional auth token
});
```

### How It Works

The React adapter uses React's internal fiber tree to resolve component information:

- Traverses the fiber tree to find the nearest function component
- Extracts source file and line number from `_debugSource` (React <19) or `_debugStack` (React 19+)
- Computes a relative DOM path from the component root to the clicked element

See [`packages/react/src/fiber.ts`](../packages/react/src/fiber.ts) for implementation details.

---

## Angular

### Installation

```bash
npm install @clens/angular
```

### Setup

1. **Enable the overlay** in your entry point:

```typescript
// src/main.ts
import "zone.js";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { enableInspectorOverlay } from "@clens/angular";

// Enable in development only
if (import.meta.env.DEV) {
  enableInspectorOverlay();
}

bootstrapApplication(AppComponent);
```

2. **Configure Vite** to use the Analog.js plugin:

Install the plugin:

```bash
npm install -D @analogjs/vite-plugin-angular
```

Update your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";

export default defineConfig({
  plugins: [angular()],
});
```

### Configuration Options

```typescript
enableInspectorOverlay({
  serverUrl: "http://localhost:3100", // MCP server URL (default)
  token: "", // Optional auth token
});
```

### How It Works

The Angular adapter uses Angular's debug APIs exposed via `window.ng`:

- Calls `ng.getComponent()` or `ng.getOwningComponent()` to retrieve the component instance
- Extracts debug info from `component.constructor.ɵcmp.debugInfo`
- Provides class name, file path, and line number
- Computes a relative DOM path from the component's host element to the clicked element

**Note**: Angular debug info is only available in development mode.

See [`packages/angular/src/angular-resolver.ts`](../packages/angular/src/angular-resolver.ts) for implementation details.

---

## Other Frameworks

You can add clens support to any framework by implementing a custom `ComponentResolver`.

### Step 1: Install Core Package

```bash
npm install @clens/lens
```

### Step 2: Implement a Resolver

A `ComponentResolver` is a function that takes a DOM element and returns component information:

```typescript
import { enableInspectorOverlay } from "@clens/lens";
import type { ComponentResolver, ComponentInfo } from "@clens/lens";

function resolveMyFrameworkComponent(
  element: HTMLElement
): ComponentInfo | null {
  // Your framework-specific logic here
  // Examples:
  // - Vue: element.__vueParentComponent
  // - Svelte: element.__svelte_meta
  // - Solid: element._$owner

  const component = getComponentFromElement(element);
  if (!component) return null;

  return {
    name: component.name, // Component name (required)
    file: component.sourceFile, // Source file path (optional)
    line: component.lineNumber, // Line number (optional)
    childPath: computePath(component.root, element), // DOM path (optional)
  };
}

// Enable with your custom resolver
enableInspectorOverlay(resolveMyFrameworkComponent);
```

### Step 3: Use the DOM Path Helper (Optional)

The `computeChildPath` utility computes a relative CSS selector from a root element to a target element:

```typescript
import { computeChildPath } from "@clens/lens";

const path = computeChildPath(rootElement, targetElement);
// Example output: "div > ul > li:nth-of-type(2)"
```

This is useful for providing context to the AI agent about which specific element was clicked within a component.

### ComponentInfo Type

```typescript
interface ComponentInfo {
  name: string; // Component name (required)
  file?: string; // Source file path
  line?: number; // Line number in source file
  childPath?: string; // Relative DOM path from component root
  element?: string; // Semantic element identifier (e.g., "button.submit")
}
```

### Example: Vue 3 Resolver

```typescript
import { enableInspectorOverlay, computeChildPath } from "@clens/lens";
import type { ComponentResolver, ComponentInfo } from "@clens/lens";

function resolveVueComponent(element: HTMLElement): ComponentInfo | null {
  // Get Vue component instance
  const instance = (element as any).__vueParentComponent;
  if (!instance) return null;

  // Get the component's root DOM element
  const rootEl = instance.vnode?.el;
  const childPath = rootEl ? computeChildPath(rootEl, element) : undefined;

  return {
    name: instance.type?.name || instance.type?.__name || "Anonymous",
    file: instance.type?.__file,
    childPath,
  };
}

// Enable with Vue resolver
if (import.meta.env.DEV) {
  enableInspectorOverlay(resolveVueComponent);
}
```

### Testing Your Resolver

1. Start your dev server with clens enabled
2. Open your app in the browser
3. Click the Inspect button in the toolbar
4. Hover over elements to see if component info appears
5. Check the browser console for any errors

---

## Advanced: Server Connection Options

All framework adapters accept the same connection configuration:

```typescript
enableInspectorOverlay({
  serverUrl: "http://localhost:3100",
  token: "your-auth-token", // Optional Bearer token
});
```

The configuration can also be changed at runtime via the settings panel (gear icon in the toolbar).

---

## Comparison Table

| Framework | Package             | Resolver Source                  | Debug Mode Required |
| --------- | ------------------- | -------------------------------- | ------------------- |
| React     | `@clens/react`      | React Fiber tree                 | No                  |
| Angular   | `@clens/angular`    | `window.ng` debug API            | Yes                 |
| Vue       | Custom              | `__vueParentComponent`           | Varies              |
| Svelte    | Custom              | `__svelte_meta`                  | Varies              |
| Solid     | Custom              | `_$owner`                        | Varies              |
| Other     | `@clens/lens` + DIY | Framework-specific introspection | Varies              |

---

## Next Steps

- [**Configuration**](configuration.md) — Environment variables, auth tokens, Cursor setup
- [**How It Works**](how-it-works.md) — Architecture and component resolution details
- [**Development**](development.md) — Building and testing your custom resolver

---

## Contributing

If you've implemented a resolver for another framework, consider contributing it back to clens:

1. Create a new package: `packages/your-framework/`
2. Follow the structure of `@clens/react` or `@clens/angular`
3. Add tests and documentation
4. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.
