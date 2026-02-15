import type { ComponentInfo } from "@clens/lens";

/**
 * Retrieves the React fiber node attached to a DOM element.
 */
export function getReactFiber(dom: HTMLElement) {
  const key = Object.keys(dom).find((k) => k.startsWith("__reactFiber$"));
  return key ? (dom as any)[key] : null;
}

/**
 * Walks up the fiber tree to find the nearest function component fiber.
 */
export function findOwnerComponentFiber(fiber: any) {
  let current = fiber;

  while (current) {
    if (typeof current.type === "function") {
      return current;
    }
    current = current.return;
  }

  return null;
}

/**
 * Parses a React 19+ _debugStack Error object to extract the source file
 * and line number from the first user-code stack frame.
 */
function parseDebugStack(
  debugStack: unknown
): { fileName: string; lineNumber: number } | null {
  if (!debugStack || typeof debugStack !== "object") return null;

  const stack = (debugStack as Error).stack;
  if (typeof stack !== "string") return null;

  // V8/Chrome:       "    at Name (url:line:col)" or "    at url:line:col"
  // Firefox/Safari:  "Name@url:line:col"  or  "@url:line:col"
  const frameRegex =
    /(?:at\s+(?:[\w$.]+\s+)?\(?|[\w$.]*@)(?:https?:\/\/[^/]+)?(\/[^:?]+)(?:\?[^:]*)?:(\d+):\d+\)?/gm;

  let match: RegExpExecArray | null;
  while ((match = frameRegex.exec(stack)) !== null) {
    const filePath = match[1];
    const lineNumber = parseInt(match[2], 10);

    // Skip React internals and dependencies
    if (filePath.includes("node_modules")) continue;

    return { fileName: filePath, lineNumber };
  }

  return null;
}

/**
 * Resolves the component name, source file, and line number for a given DOM element
 * by inspecting its React fiber. Uses the element fiber's own debug info to point
 * to where the element is defined (inside the component), while using the nearest
 * owner component fiber for the component name.
 * Supports both React <19 (_debugSource) and React 19+ (_debugStack).
 */
export function resolveComponentInfo(dom: HTMLElement): ComponentInfo | null {
  const fiber = getReactFiber(dom);
  if (!fiber) return null;

  const owner = findOwnerComponentFiber(fiber);
  if (!owner) return null;

  // Read source from the element fiber itself so the location points to
  // where the element is defined inside the component, not where the
  // component is instantiated by its parent.

  // React <19: source info is stored directly on the fiber
  const source = fiber._debugSource;
  if (source) {
    return {
      name: owner.type?.name ?? "Anonymous",
      file: source.fileName,
      line: source.lineNumber,
      childPath: undefined,
    };
  }

  // React 19+: source info is captured as a stack trace Error
  const parsed = parseDebugStack(fiber._debugStack);

  return {
    name: owner.type?.name ?? "Anonymous",
    file: parsed?.fileName,
    line: parsed?.lineNumber,
    childPath: undefined,
  };
}
