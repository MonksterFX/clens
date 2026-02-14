/**
 * Connection configuration for the inspector overlay.
 * Stores server URL and optional authentication token.
 */
export interface ConnectionConfig {
  serverUrl: string;
  token: string;
}

const STORAGE_KEY = "__inspector_connection__";
const DEFAULT_CONFIG: ConnectionConfig = {
  serverUrl: "http://localhost:3100",
  token: "",
};

let currentConfig: ConnectionConfig = { ...DEFAULT_CONFIG };
const subscribers: Array<(config: ConnectionConfig) => void> = [];

/**
 * Loads the connection config from localStorage on module initialization.
 */
function loadConfig(): ConnectionConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn("[inspector] Failed to load connection config:", err);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Saves the connection config to localStorage.
 */
function saveConfig(config: ConnectionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn("[inspector] Failed to save connection config:", err);
  }
}

/**
 * Notifies all subscribers of a config change.
 */
function notifySubscribers(): void {
  subscribers.forEach((fn) => fn(currentConfig));
}

/**
 * Returns the current connection configuration.
 */
export function getConfig(): ConnectionConfig {
  return { ...currentConfig };
}

/**
 * Updates the connection configuration and persists to localStorage.
 */
export function setConfig(config: Partial<ConnectionConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  saveConfig(currentConfig);
  notifySubscribers();
}

/**
 * Subscribes to connection config changes.
 * Returns an unsubscribe function.
 */
export function subscribe(
  callback: (config: ConnectionConfig) => void
): () => void {
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx !== -1) subscribers.splice(idx, 1);
  };
}

/**
 * Returns the full URL for the task submission endpoint.
 */
export function getTaskEndpoint(): string {
  return `${currentConfig.serverUrl}/task`;
}

/**
 * Returns the full URL for the health check endpoint.
 */
export function getHealthEndpoint(): string {
  return `${currentConfig.serverUrl}/health`;
}

/**
 * Initializes the connection config by loading from localStorage.
 * Should be called once when the overlay is enabled.
 */
export function initConfig(overrides?: Partial<ConnectionConfig>): void {
  currentConfig = loadConfig();
  if (overrides) {
    currentConfig = { ...currentConfig, ...overrides };
    saveConfig(currentConfig);
  }
}

// Load config on module initialization
currentConfig = loadConfig();
