import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";

import { enableInspectorOverlay } from "@react-visual-debugger/lens"

enableInspectorOverlay()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
