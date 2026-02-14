import React, { useState, useRef, useEffect, useCallback } from "react"
import { checkHealth } from "../../lib/services/health"
import { subscribe } from "../../lib/config/connection"
import { ToolbarButton, Divider } from "./toolbarButton"
import { InspectIcon, SettingsIcon } from "./icons"

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
