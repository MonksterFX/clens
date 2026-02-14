/**
 * CSS for the tooltip anchor positioning and @position-try fallbacks.
 * Default: tooltip top-left at anchor bottom-left.
 * Fallbacks: top-right at anchor bottom-right, bottom-left at anchor top-left,
 *            bottom-right at anchor top-right.
 */
export const TOOLTIP_STYLES = `
  @position-try --inspector-br {
    top: anchor(bottom);
    bottom: auto;
    left: auto;
    right: anchor(right);
    margin: 6px 0 0 0;
  }

  @position-try --inspector-tl {
    top: auto;
    bottom: anchor(top);
    left: anchor(left);
    right: auto;
    margin: 0 0 6px 0;
  }

  @position-try --inspector-tr {
    top: auto;
    bottom: anchor(top);
    left: auto;
    right: anchor(right);
    margin: 0 0 6px 0;
  }

  [data-inspector-tooltip] {
    position: fixed;
    position-anchor: --inspector-target;
    top: anchor(bottom);
    left: anchor(left);
    margin: 6px 0 0 0;
    position-try-fallbacks: --inspector-br, --inspector-tl, --inspector-tr;
  }
`
