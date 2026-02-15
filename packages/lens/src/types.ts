/**
 * Component information extracted from framework-specific component trees.
 */
export interface ComponentInfo {
  /** Name of the component. e.g. "AppComponent", "MyComponent" */
  name: string;
  /** Source file path of the component. e.g. "src/app/app.component.ts" */
  file?: string;
  /** Line number of the component in the source file. e.g. 10 */
  line?: number;
  /** Relative DOM path from the component root to a selected child element. e.g. "div > ul > li:nth-of-type(2)" */
  childPath?: string;
  /** Semantic identifier for a specific element within the component. e.g. "button.submit", "input#email" */
  element?: string;
}

/**
 * Function that resolves component information from a DOM element.
 * Implemented by framework-specific packages (@clens/react, @clens/angular, etc.)
 */
export type ComponentResolver = (element: HTMLElement) => ComponentInfo | null;
