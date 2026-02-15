import React, { useEffect, useRef, useState } from "react";
import type { ComponentInfo } from "../types";
import { getComponentResolver } from "../resolver";
import { Tooltip } from "./tooltip";
import { Toolbar } from "./toolbar";
import { SettingsPanel } from "./settingsPanel";

const OUTLINE_STYLE = "2px solid #3b82f6";
const CHILDREN_OUTLINE_STYLE = "2px dashed #3b82f6";
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
  const [childSelection, setChildSelection] = useState(true);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const anchoredRef = useRef<HTMLElement | null>(null);
  const prevOutlineRef = useRef<string>("");
  const outlinedChildrenRef = useRef<{ el: HTMLElement; prev: string }[]>([]);

  useEffect(() => {
    if (!enabled) {
      clearOutline();
      clearAnchor();
      clearChildOutlines();
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

    /** Removes dashed outlines from previously outlined child elements. */
    function clearChildOutlines() {
      for (const { el, prev } of outlinedChildrenRef.current) {
        el.style.outline = prev;
      }
      outlinedChildrenRef.current = [];
    }

    /** Applies a dashed outline to the direct children of the given element. */
    function outlineChildren(parent: HTMLElement) {
      clearChildOutlines();
      const children = Array.from(parent.children) as HTMLElement[];
      for (const child of children) {
        outlinedChildrenRef.current.push({
          el: child,
          prev: child.style.outline,
        });
        child.style.outline = CHILDREN_OUTLINE_STYLE;
      }
    }

    /** Applies a blue outline to the hovered element and dashed outlines to its children. */
    function onHover(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target || target === hoveredRef.current) return;

      const overlayRoot = document.getElementById(
        "__clens_inspector_overlay__"
      );
      if (overlayRoot?.contains(target)) return;

      clearChildOutlines();
      clearOutline();

      prevOutlineRef.current = target.style.outline;
      target.style.outline = OUTLINE_STYLE;
      hoveredRef.current = target;

      if (childSelection) {
        outlineChildren(target);
      }
    }

    /** Sets anchor-name on the clicked element and resolves component info. */
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target) return;

      const overlayRoot = document.getElementById(
        "__clens_inspector_overlay__"
      );
      if (overlayRoot?.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();

      const resolver = getComponentResolver();
      const resolved = resolver(target);
      if (resolved) {
        // Remove anchor and child outlines from the previous element
        clearAnchor();
        clearChildOutlines();

        // Assign CSS anchor-name to the clicked element
        target.style.setProperty("anchor-name", ANCHOR_NAME);
        anchoredRef.current = target;

        // Outline direct children with a dashed border (when child selection is on)
        if (childSelection) {
          outlineChildren(target);
        }

        // Strip childPath when child selection is disabled
        setInfo(
          childSelection ? resolved : { ...resolved, childPath: undefined }
        );
        setAnchored(true);
      }
    }

    /** Dismisses the tooltip when pressing Escape. */
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        clearAnchor();
        clearChildOutlines();
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
      clearChildOutlines();
      window.removeEventListener("mouseover", onHover);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, childSelection]);

  return (
    <>
      <Toolbar
        enabled={enabled}
        setEnabled={setEnabled}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      {enabled && anchored && (
        <Tooltip
          info={info}
          childSelection={childSelection}
          setChildSelection={setChildSelection}
        />
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
