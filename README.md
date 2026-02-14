# clens

A tiny dev-only React component inspector overlay for Vite.

It adds a **floating draggable button** that enables "Tooltip Mode":

- Hover any element → see the React component name + file + line
- Click toggle button → enable/disable inspector
- Minimal UI, perfect for debugging in preview environments

---

## ✨ Features

✅ Floating draggable toggle button  
✅ Tooltip mode ON/OFF  
✅ Hover → component + source file + line number  
✅ Works in React + Vite dev mode  
✅ Lightweight, no config beyond Babel source support  

---

## 📦 Integration (Browser Import / CDN)

You can use this overlay **without installing via npm**, by importing it directly in the browser.

---

### 1. Build Output Must Be ESM

Make sure the package is published with an ESM build:

```
dist/index.js
dist/index.d.ts
```

---

### 2. Import from CDN

Example using **esm.sh**:

```html
<script type="module">
  import { enableInspectorOverlay } from "https://esm.sh/clens"

  enableInspectorOverlay()
</script>


3. Add It to Your Vite React App

The best place is inside your main.tsx or main.jsx:

```ts
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"

// Browser/CDN import
import { enableInspectorOverlay } from "https://esm.sh/vite-react-inspector-overlay"

enableInspectorOverlay()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
)
```

# Required Vite Configuration

React only provides file + line info if you enable:

@babel/plugin-transform-react-jsx-source

Install:

npm install -D @babel/plugin-transform-react-jsx-source


Then update your vite.config.ts:

import react from "@vitejs/plugin-react"

export default {
  plugins: [
    react({
      babel: {
        plugins: ["@babel/plugin-transform-react-jsx-source"],
      },
    }),
  ],
}


## Usage

```ts
import react from "@vitejs/plugin-react"

export default {
  plugins: [
    react({
      babel: {
        plugins: ["@babel/plugin-transform-react-jsx-source"]
      }
    })
  ]
}
```
