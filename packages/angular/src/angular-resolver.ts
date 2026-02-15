import { computeChildPath } from "@clens/lens";
import type { ComponentInfo } from "@clens/lens";

/**
 * Angular debug information extracted from the component constructor.
 * @see https://github.com/angular/angular/blob/main/packages/core/src/render3/debug/set_debug_info.ts
 * @see https://github.com/angular/angular/blob/main/packages/core/src/render3/interfaces/definition.ts#L53
 */
type AngularDebugInfo = {
  className: string;
  filePath: string;
  lineNumber: number;
};

/**
 * Resolves component information from an Angular DOM element using the
 * Angular debug APIs exposed in development mode via window.ng.
 * Falls back to showing the component selector in the file field since
 * Angular doesn't natively expose source file paths.
 */
export function resolveComponentInfo(
  element: HTMLElement
): ComponentInfo | null {
  const ng = (window as any).ng;
  if (!ng) return null;

  // Try to get the component on this element first, then owning component
  let component = ng.getComponent(element) ?? ng.getOwningComponent(element);
  if (!component) return null;

  // Compute relative DOM path from the component's host element to the target
  const hostElement: HTMLElement | null =
    ng.getHostElement?.(component) ?? null;
  const childPath = hostElement
    ? computeChildPath(hostElement, element)
    : undefined;

  const { className, filePath, lineNumber } = component.constructor.ɵcmp
    .debugInfo as AngularDebugInfo;

  return {
    name: className,
    file: filePath,
    line: lineNumber,
    childPath,
  };
}
