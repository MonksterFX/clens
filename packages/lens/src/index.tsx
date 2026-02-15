// src/index.ts

import { createRoot } from "react-dom/client";
import { InspectorOverlay } from "./ui/overlay";
import { initConfig, type ConnectionConfig } from "./lib/config/connection";
import { setComponentResolver, type ComponentResolver } from "./resolver";

/**
 * Enables the inspector overlay in development mode.
 * Accepts a framework-specific component resolver and optional connection configuration.
 */
export function enableInspectorOverlay(
  resolver: ComponentResolver,
  config?: Partial<ConnectionConfig>
): void {
  if (import.meta.env.PROD) return;

  // Set the component resolver
  setComponentResolver(resolver);

  // Initialize connection config with optional overrides
  if (config) {
    initConfig(config);
  }

  const container = document.createElement("div");
  container.id = "__clens_inspector_overlay__";
  document.body.appendChild(container);

  createRoot(container).render(<InspectorOverlay />);
}

// Export types for framework-specific packages
export type { ComponentInfo, ComponentResolver } from "./types";
export type { ConnectionConfig } from "./lib/config/connection";

// Export DOM utilities for framework-specific resolvers
export { computeChildPath } from "./lib/dom/childPath";
