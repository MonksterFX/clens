import { describe, it, expect, beforeEach } from "vitest";
import {
  getConfig,
  setConfig,
  subscribe,
  getTaskEndpoint,
  getHealthEndpoint,
  initConfig,
} from "./connection";

describe("connection config", () => {
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize to defaults after clearing storage
    initConfig();
  });

  /** Verifies default config values are returned when no overrides exist. */
  it("should have default config", () => {
    const config = getConfig();
    expect(config.serverUrl).toBe("http://localhost:3100");
    expect(config.token).toBe("");
  });

  /** Verifies setConfig merges partial updates correctly. */
  it("should update config via setConfig", () => {
    setConfig({ serverUrl: "http://localhost:9999" });
    const config = getConfig();
    expect(config.serverUrl).toBe("http://localhost:9999");
    expect(config.token).toBe("");
  });

  /** Verifies config is persisted to and restored from localStorage. */
  it("should persist config to localStorage", () => {
    setConfig({ serverUrl: "http://example.com", token: "abc123" });
    const stored = localStorage.getItem("__inspector_connection__");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.serverUrl).toBe("http://example.com");
    expect(parsed.token).toBe("abc123");
  });

  /** Verifies initConfig applies overrides on top of defaults. */
  it("should initialize with overrides", () => {
    initConfig({ token: "my-token" });
    const config = getConfig();
    expect(config.token).toBe("my-token");
    expect(config.serverUrl).toBe("http://localhost:3100");
  });

  /** Verifies subscribe/unsubscribe lifecycle. */
  it("should notify subscribers on config change", () => {
    let notified = false;
    const unsub = subscribe(() => {
      notified = true;
    });
    setConfig({ token: "x" });
    expect(notified).toBe(true);
    unsub();
  });

  /** Verifies unsubscribe prevents future notifications. */
  it("should stop notifying after unsubscribe", () => {
    let count = 0;
    const unsub = subscribe(() => {
      count++;
    });
    setConfig({ token: "a" });
    unsub();
    setConfig({ token: "b" });
    expect(count).toBe(1);
  });

  /** Verifies task endpoint URL construction. */
  it("should return correct task endpoint", () => {
    expect(getTaskEndpoint()).toBe("http://localhost:3100/task");
  });

  /** Verifies health endpoint URL construction. */
  it("should return correct health endpoint", () => {
    expect(getHealthEndpoint()).toBe("http://localhost:3100/health");
  });

  /** Verifies getConfig returns a copy, not a mutable reference. */
  it("should return a copy from getConfig", () => {
    const config = getConfig();
    config.serverUrl = "http://mutated.com";
    expect(getConfig().serverUrl).toBe("http://localhost:3100");
  });
});
