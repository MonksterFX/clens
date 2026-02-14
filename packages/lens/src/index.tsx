// src/index.ts

import { createRoot } from "react-dom/client"
import { InspectorOverlay } from "./ui/overlay"
import { initConfig, type ConnectionConfig } from "./lib/config/connection"

/**
 * Enables the React inspector overlay in development mode.
 * Optionally accepts initial connection configuration.
 */
export function enableInspectorOverlay(
  config?: Partial<ConnectionConfig>
): void {
  if (import.meta.env.PROD) return

  // Initialize connection config with optional overrides
  if (config) {
    initConfig(config)
  }

  const container = document.createElement("div")
  container.id = "__vite_react_inspector_overlay__"
  document.body.appendChild(container)

  createRoot(container).render(<InspectorOverlay />)
}
