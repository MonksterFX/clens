import { enableInspectorOverlay as enableOverlay } from "@clens/lens";
import type { ConnectionConfig } from "@clens/lens";
import { resolveComponentInfo } from "./fiber";

/**
 * Enables the React component inspector overlay in development mode.
 * Optionally accepts initial connection configuration.
 */
export function enableInspectorOverlay(
  config?: Partial<ConnectionConfig>
): void {
  enableOverlay(resolveComponentInfo, config);
}
