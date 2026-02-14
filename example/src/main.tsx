import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";

import { enableInspectorOverlay } from "../../packages/lens/src/index"

enableInspectorOverlay()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
