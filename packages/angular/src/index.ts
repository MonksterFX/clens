import { enableInspectorOverlay as enableOverlay } from "@clens/lens";
import type { ConnectionConfig } from "@clens/lens";
import { resolveComponentInfo } from "./angular-resolver";

/**
 * Enables the Angular component inspector overlay in development mode.
 * Optionally accepts initial connection configuration.
 */
export function enableInspectorOverlay(
  config?: Partial<ConnectionConfig>
): void {
  enableOverlay(resolveComponentInfo, config);
}
