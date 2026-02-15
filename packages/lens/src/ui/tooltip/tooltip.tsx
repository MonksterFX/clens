import React, { useRef, useState } from "react";
import type { ComponentInfo } from "../../types";
import { formatInfoForAI, sendTask } from "../../lib/services/task";
import { TOOLTIP_STYLES } from "./tooltipStyles";

interface TooltipProps {
  info: ComponentInfo | null;
  /** Whether child element selection / path tracking is enabled. */
  childSelection: boolean;
  /** Callback to toggle child selection on or off. */
  setChildSelection: (value: boolean) => void;
}

/**
 * Displays component name and source location in a tooltip anchored to the
 * bottom-right of the inspected element using the CSS Anchor Positioning API.
 * Falls back to bottom-left, top-right, or top-left when overflowing the viewport.
 * Includes a copy button for pasting info into AI tools and a toggle for child selection.
 */
export function Tooltip({
  info,
  childSelection,
  setChildSelection,
}: TooltipProps) {
  const [copied, setCopied] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [taskStatus, setTaskStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!info) return null;

  /** Copies the component info to the clipboard. */
  function handleCopy() {
    if (!info) return;
    navigator.clipboard.writeText(formatInfoForAI(info)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  /** Sends the task text to the MCP server and resets the input. */
  async function handleSendTask() {
    if (!info) return;
    const text = taskText.trim();
    if (!text) return;

    setTaskStatus("sending");
    try {
      await sendTask(text, info);
      setTaskStatus("sent");
      setTaskText("");
      setTimeout(() => setTaskStatus("idle"), 1500);
    } catch {
      setTaskStatus("error");
      setTimeout(() => setTaskStatus("idle"), 2000);
    }
  }

  /** Submits on Enter key press. */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSendTask();
    }
  }

  const sendLabel =
    taskStatus === "sending"
      ? "…"
      : taskStatus === "sent"
        ? "Sent!"
        : taskStatus === "error"
          ? "Error"
          : "Send";

  const sendBg =
    taskStatus === "sent"
      ? "#22c55e"
      : taskStatus === "error"
        ? "#ef4444"
        : "rgba(255,255,255,0.15)";

  return (
    <>
      <style>{TOOLTIP_STYLES}</style>
      <div
        data-inspector-tooltip
        style={{
          background: "rgba(0,0,0,0.85)",
          color: "white",
          padding: "8px 10px",
          borderRadius: "10px",
          fontSize: 12,
          zIndex: 999999,
          maxWidth: 400,
          pointerEvents: "auto",
          whiteSpace: "nowrap",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Task input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            ref={inputRef}
            type="text"
            value={taskText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTaskText(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Send a task to AI…"
            style={{
              flex: 1,
              minWidth: 0,
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 11,
              outline: "none",
            }}
          />
          <button
            onClick={handleSendTask}
            disabled={taskStatus === "sending" || !taskText.trim()}
            style={{
              background: sendBg,
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 11,
              cursor:
                taskStatus === "sending" || !taskText.trim()
                  ? "default"
                  : "pointer",
              flexShrink: 0,
              opacity: taskStatus === "sending" || !taskText.trim() ? 0.5 : 1,
              transition: "background 0.2s, opacity 0.2s",
            }}
            title="Send task to AI agent"
          >
            {sendLabel}
          </button>
          <button
            onClick={() => setChildSelection(!childSelection)}
            style={{
              background: childSelection
                ? "rgba(59,130,246,0.5)"
                : "rgba(255,255,255,0.1)",
              color: "white",
              border: childSelection
                ? "1px solid #3b82f6"
                : "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "4px 6px",
              fontSize: 11,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.2s, border-color 0.2s",
              lineHeight: 1,
            }}
            title={
              childSelection
                ? "Child selection ON – click to disable"
                : "Child selection OFF – click to enable"
            }
          >
            {childSelection ? "⊞" : "⊟"}
          </button>
        </div>
        {/* Component info row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{info.name}</div>
            <div style={{ opacity: 0.75 }}>
              {info.file}:{info.line}
            </div>
            {info.childPath && (
              <div
                style={{
                  opacity: 0.6,
                  fontSize: 11,
                  fontFamily: "monospace",
                  marginTop: 2,
                }}
              >
                ▸ {info.childPath}
              </div>
            )}
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#22c55e" : "rgba(255,255,255,0.15)",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 11,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
            title="Copy component info for AI"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </>
  );
}
