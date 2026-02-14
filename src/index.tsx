// src/index.ts

import React from "react"
import { createRoot } from "react-dom/client"
import { InspectorOverlay } from "./overlay"

export function enableInspectorOverlay() {
  if (import.meta.env.PROD) return

  const container = document.createElement("div")
  container.id = "__vite_react_inspector_overlay__"
  document.body.appendChild(container)

  createRoot(container).render(<InspectorOverlay />)
}
