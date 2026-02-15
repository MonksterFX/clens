import type { ComponentResolver } from "./types";

export type { ComponentResolver };

/**
 * Module-level registry for the active component resolver.
 * Set by framework-specific packages via enableInspectorOverlay.
 */
let resolver: ComponentResolver = () => null;

/**
 * Sets the component resolver to be used by the overlay.
 */
export function setComponentResolver(r: ComponentResolver): void {
  resolver = r;
}

/**
 * Gets the currently active component resolver.
 */
export function getComponentResolver(): ComponentResolver {
  return resolver;
}
