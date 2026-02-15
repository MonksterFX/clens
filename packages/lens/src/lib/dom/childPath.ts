/**
 * Computes a CSS-selector-like relative path from a component's root DOM
 * element to a descendant target element.
 *
 * Returns `undefined` when `target` is the root itself or is not a descendant
 * of `root`. Uses `nth-of-type` for disambiguation when siblings share the
 * same tag name.
 *
 * @example
 * // <div id="root"><ul><li></li><li class="active"></li></ul></div>
 * computeChildPath(root, activeLi) // "ul > li:nth-of-type(2)"
 */
export function computeChildPath(
  root: HTMLElement,
  target: HTMLElement
): string | undefined {
  if (root === target) return undefined;
  if (!root.contains(target)) return undefined;

  const segments: string[] = [];
  let current: HTMLElement | null = target;

  while (current && current !== root) {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;

    if (parent) {
      const sameTagSiblings = Array.from(parent.children).filter(
        (el) => el.tagName.toLowerCase() === tag
      );

      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        segments.unshift(`${tag}:nth-of-type(${index})`);
      } else {
        segments.unshift(tag);
      }
    } else {
      segments.unshift(tag);
    }

    current = parent;
  }

  return segments.length > 0 ? segments.join(" > ") : undefined;
}
