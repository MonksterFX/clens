// src/button.tsx

import React, { useState, useRef } from "react"

export function FloatingToggleButton({
  enabled,
  setEnabled,
}: {
  enabled: boolean
  setEnabled: (v: boolean) => void
}) {
  const [pos, setPos] = useState({ x: 20, y: 20 })
  const dragging = useRef(false)

  function onMouseDown() {
    dragging.current = true
  }

  function onMouseUp() {
    dragging.current = false
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    setPos({ x: e.clientX - 20, y: e.clientY - 20 })
  }

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 999999,
      }}
    >
      <button
        onMouseDown={onMouseDown}
        onClick={() => setEnabled(!enabled)}
        style={{
          position: "fixed",
          top: pos.y,
          left: pos.x,
          width: 44,
          height: 44,
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          background: enabled ? "#16a34a" : "#444",
          color: "white",
          fontSize: 18,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}
        title="Toggle Tooltip Inspector"
      >
        ⊕
      </button>
    </div>
  )
}
