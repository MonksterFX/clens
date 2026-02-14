import React, { useState, useEffect } from "react"
import { getConfig, setConfig } from "../lib/config/connection"
import { checkHealth } from "../lib/services/health"

/**
 * Settings panel for configuring the connection to the MCP server.
 * Allows users to set the server URL and authentication token.
 */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [serverUrl, setServerUrl] = useState("")
  const [token, setToken] = useState("")
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle")

  useEffect(() => {
    const config = getConfig()
    setServerUrl(config.serverUrl)
    setToken(config.token)
  }, [])

  /** Tests the connection with the current values. */
  async function handleTestConnection() {
    setTestStatus("testing")

    // Temporarily apply the config for testing
    const oldConfig = getConfig()
    setConfig({ serverUrl, token })

    const ok = await checkHealth()
    setTestStatus(ok ? "success" : "error")

    // Restore old config if test failed
    if (!ok) {
      setConfig(oldConfig)
    }

    setTimeout(() => setTestStatus("idle"), 2000)
  }

  /** Saves the configuration and closes the panel. */
  function handleSave() {
    setConfig({ serverUrl, token })
    onClose()
  }

  /** Handles Escape key to close the panel. */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  /** Prevents click events from closing the panel when clicking inside. */
  function handlePanelClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  const testLabel =
    testStatus === "testing"
      ? "Testing…"
      : testStatus === "success"
        ? "Connected!"
        : testStatus === "error"
          ? "Failed"
          : "Test Connection"

  const testBg =
    testStatus === "success"
      ? "#22c55e"
      : testStatus === "error"
        ? "#ef4444"
        : "rgba(255,255,255,0.15)"

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000000,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={handlePanelClick}
        onKeyDown={handleKeyDown}
        style={{
          background: "rgba(0,0,0,0.95)",
          color: "white",
          padding: "20px 24px",
          borderRadius: "12px",
          fontSize: 13,
          minWidth: 320,
          maxWidth: 450,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Connection Settings
        </div>

        {/* Server URL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>
            Server URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:3100"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "8px 10px",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {/* Token */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>
            Token (optional)
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token for authentication"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "8px 10px",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 8,
          }}
        >
          <button
            onClick={handleTestConnection}
            disabled={testStatus === "testing"}
            style={{
              flex: 1,
              background: testBg,
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor: testStatus === "testing" ? "default" : "pointer",
              opacity: testStatus === "testing" ? 0.6 : 1,
              transition: "background 0.2s, opacity 0.2s",
            }}
          >
            {testLabel}
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Save
          </button>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
