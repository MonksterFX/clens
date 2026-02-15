import type { ComponentInfo } from "../../types";
import { getConfig, getTaskEndpoint } from "../config/connection";

/**
 * Formats component info into an AI-friendly string for clipboard.
 */
export function formatInfoForAI(info: ComponentInfo): string {
  let text = `Component: ${info.name}\nFile: ${info.file}\nLine: ${info.line}`;
  if (info.childPath) {
    text += `\nChild: ${info.childPath}`;
  }
  return text;
}

/**
 * Sends a task (with component context) to the MCP HTTP server.
 */
export async function sendTask(
  text: string,
  info: ComponentInfo
): Promise<void> {
  const body = JSON.stringify({
    text,
    component: {
      name: info.name,
      file: info.file,
      line: info.line,
      ...(info.element ? { element: info.element } : {}),
    },
  });

  const config = getConfig();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }

  const res = await fetch(getTaskEndpoint(), {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }
}
