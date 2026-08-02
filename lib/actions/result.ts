/**
 * Shared result envelope for Server Actions.
 *
 * Every action returns `ActionResult<T>` — a discriminated union the client
 * can render as a toast without try/catch plumbing.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function runActionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    }
  }
}