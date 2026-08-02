/**
 * Simulated network latency for the mock repos (decision D2).
 *
 * Repos await this helper so pages behave like a real HTTP-backed app;
 * swapping the repo binding for `lib/api` changes nothing above this layer.
 */

export function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}