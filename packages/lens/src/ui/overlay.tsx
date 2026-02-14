import React, { useEffect, useRef, useState } from "react";
import type { ComponentInfo } from "../types";
import { resolveComponentInfo } from "../utils/fiber";
import { Tooltip } from "./tooltip";
import { Toolbar } from "./toolbar";
import { SettingsPanel } from "./settingsPanel";

const OUTLINE_STYLE = "2px solid #3b82f6";
const ANCHOR_NAME = "--inspector-target";

/**
 * Main inspector overlay that highlights hovered elements with a blue outline
 * and shows component info in a tooltip on click.
 * Uses the CSS Anchor Positioning API to anchor the tooltip to the clicked element.
 */
export function InspectorOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [info, setInfo] = useState<ComponentInfo | null>(null);
  const [anchored, setAnchored] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const anchoredRef = useRef<HTMLElement | null>(null);
  const prevOutlineRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) {
      clearOutline();
      clearAnchor();
      setInfo(null);
      setAnchored(false);
      return;
    }

    /** Removes the blue outline from the previously highlighted element. */
    function clearOutline() {
      if (hoveredRef.current) {
        hoveredRef.current.style.outline = prevOutlineRef.current;
        hoveredRef.current = null;
        prevOutlineRef.current = "";
      }
    }

    /** Removes the CSS anchor-name from the previously anchored element. */
    function clearAnchor() {
      if (anchoredRef.current) {
        anchoredRef.current.style.removeProperty("anchor-name");
        anchoredRef.current = null;
      }
    }

    /** Applies a blue outline to the hovered element. */
    function onHover(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target || target === hoveredRef.current) return;

      const overlayRoot = document.getElementById(
        "__vite_react_inspector_overlay__"
      );
      if (overlayRoot?.contains(target)) return;

      clearOutline();

      prevOutlineRef.current = target.style.outline;
      target.style.outline = OUTLINE_STYLE;
      hoveredRef.current = target;
    }

    /** Sets anchor-name on the clicked element and resolves component info. */
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target) return;

      const overlayRoot = document.getElementById(
        "__vite_react_inspector_overlay__"
      );
      if (overlayRoot?.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();

      const resolved = resolveComponentInfo(target);
      if (resolved) {
        // Remove anchor from the previous element
        clearAnchor();

        // Assign CSS anchor-name to the clicked element
        target.style.setProperty("anchor-name", ANCHOR_NAME);
        anchoredRef.current = target;

        setInfo(resolved);
        setAnchored(true);
      }
    }

    /** Dismisses the tooltip when pressing Escape. */
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        clearAnchor();
        setInfo(null);
        setAnchored(false);
      }
    }

    window.addEventListener("mouseover", onHover);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearOutline();
      clearAnchor();
      window.removeEventListener("mouseover", onHover);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  return (
    <>
      <Toolbar
        enabled={enabled}
        setEnabled={setEnabled}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      {enabled && anchored && <Tooltip info={info} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
