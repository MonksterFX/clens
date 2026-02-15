/**
 * Component information extracted from framework-specific component trees.
 */
export interface ComponentInfo {
  name: string;
  file: string | undefined;
  line: number | undefined;
  /** Relative DOM path from the component root to a selected child element. */
  childPath: string | undefined;
}

/**
 * Function that resolves component information from a DOM element.
 * Implemented by framework-specific packages (@clens/react, @clens/angular, etc.)
 */
export type ComponentResolver = (element: HTMLElement) => ComponentInfo | null;
