import { getConfig, getHealthEndpoint } from "../config/connection"

/**
 * Checks the connection health by calling GET /health.
 * Returns true if the server responds with status 200, false otherwise.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const config = getConfig()
    const headers: HeadersInit = {}
    if (config.token) {
      headers["Authorization"] = `Bearer ${config.token}`
    }

    const res = await fetch(getHealthEndpoint(), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    return res.ok
  } catch (err) {
    console.warn("[inspector] Health check failed:", err)
    return false
  }
}
