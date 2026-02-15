/**
 * Dashboard entry point.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { enableInspectorOverlay } from "@clens/react";
import { App } from "./App";
import "./index.css";

enableInspectorOverlay();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
