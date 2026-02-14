import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";

import { enableInspectorOverlay } from "@clens/lens";

enableInspectorOverlay();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
