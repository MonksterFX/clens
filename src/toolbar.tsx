// src/toolbar.tsx

import React, { useState, useRef, useEffect, useCallback } from "react"
import { checkHealth, subscribe } from "./connection"

type HealthStatus = "checking" | "connected" | "disconnected"

/**
 * Draggable inspector toolbar with inspect toggle, connection status, and
 * settings button. Replaces the old floating circular button.
 */
export function Toolbar({
  enabled,
  setEnabled,
  onSettingsOpen,
}: {
  enabled: boolean
  setEnabled: (v: boolean) => void
  onSettingsOpen: () => void
}) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking")
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  /**
   * Performs a health check with a 2s debounce on state transitions.
   * Shows "checking" only after 2s of no response, and if "checking"
   * is shown it stays visible for at least 2s to avoid flickering.
   */
  const performHealthCheck = useCallback(async () => {
    let showedChecking = false
    let checkingShownAt = 0

    const timer = setTimeout(() => {
      showedChecking = true
      checkingShownAt = Date.now()
      setHealthStatus("checking")
    }, 2000)

    const ok = await checkHealth()
    clearTimeout(timer)

    const nextStatus = ok ? "connected" : "disconnected"

    if (showedChecking) {
      const elapsed = Date.now() - checkingShownAt
      const remaining = 2000 - elapsed
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining))
      }
    }

    setHealthStatus(nextStatus)
  }, [])

  /** Sets up health polling every 5s and subscribes to config changes. */
  useEffect(() => {
    performHealthCheck()
    const interval = setInterval(performHealthCheck, 5000)
    const unsubscribe = subscribe(() => {
      performHealthCheck()
    })
    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [performHealthCheck])

  /** Centres the toolbar at the bottom on first render. */
  useEffect(() => {
    if (!toolbarRef.current) return
    const rect = toolbarRef.current.getBoundingClientRect()
    setPos({
      x: Math.round((window.innerWidth - rect.width) / 2),
      y: window.innerHeight - rect.height - 16,
    })
  }, [])

  /** Initiates drag from the toolbar background. */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only drag from the toolbar itself, not from buttons
      if ((e.target as HTMLElement).closest("button")) return
      e.preventDefault()
      dragging.current = true
      const currentPos = pos ?? { x: 0, y: 0 }
      dragOffset.current = {
        x: e.clientX - currentPos.x,
        y: e.clientY - currentPos.y,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pos]
  )

  /** Updates toolbar position during drag. */
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    })
  }, [])

  /** Ends the drag interaction. */
  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const statusColor =
    healthStatus === "connected"
      ? "#22c55e"
      : healthStatus === "disconnected"
        ? "#ef4444"
        : "#eab308"

  const statusLabel =
    healthStatus === "connected"
      ? "Connected"
      : healthStatus === "disconnected"
        ? "Disconnected"
        : "Checking…"

  return (
    <div
      ref={toolbarRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        top: pos?.y ?? -9999,
        left: pos?.x ?? -9999,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "rgba(24, 24, 27, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 10,
        padding: "4px 4px",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: dragging.current ? "grabbing" : "grab",
        userSelect: "none",
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        fontSize: 12,
        color: "white",
        opacity: pos ? 1 : 0,
        transition: dragging.current ? "none" : "opacity 0.2s",
      }}
    >
      {/* Inspect toggle */}
      <ToolbarButton
        active={enabled}
        onClick={() => setEnabled(!enabled)}
        title={enabled ? "Disable inspector" : "Enable inspector"}
      >
        <InspectIcon />
        <span style={{ marginLeft: 4 }}>
          {enabled ? "Inspecting" : "Inspect"}
        </span>
      </ToolbarButton>

      <Divider />

      {/* Connection status */}
      <ToolbarButton
        onClick={performHealthCheck}
        title={`Status: ${statusLabel} — Click to recheck`}
      >
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: statusColor,
            boxShadow: `0 0 4px ${statusColor}`,
            flexShrink: 0,
          }}
        />
        <span style={{ marginLeft: 5, opacity: 0.8 }}>{statusLabel}</span>
      </ToolbarButton>

      <Divider />

      {/* Settings */}
      <ToolbarButton onClick={onSettingsOpen} title="Connection settings">
        <SettingsIcon />
      </ToolbarButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Reusable toolbar button with hover/active states. */
function ToolbarButton({
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

/** Vertical divider between toolbar sections. */
function Divider() {
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

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG)                                                 */
/* ------------------------------------------------------------------ */

/** Crosshair / inspect icon. */
function InspectIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  )
}

/** Gear / settings icon. */
function SettingsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
