import React, { useState } from "react"

/**
 * Reusable toolbar button with hover/active states.
 */
export function ToolbarButton({
  children,
  onClick,
  title,
  active = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  active?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "5px 10px",
        border: "none",
        borderRadius: 7,
        background: active
          ? "rgba(59, 130, 246, 0.35)"
          : hovered
            ? "rgba(255,255,255,0.1)"
            : "transparent",
        color: active ? "#93bbfc" : "rgba(255,255,255,0.85)",
        fontSize: 12,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  )
}

/**
 * Vertical divider between toolbar sections.
 */
export function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 18,
        background: "rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}
    />
  )
}
