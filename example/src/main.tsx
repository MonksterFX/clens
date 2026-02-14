import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";

import { enableInspectorOverlay } from "../../src/index.js"

enableInspectorOverlay()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
