import { syncAllTaskSheets } from "@/lib/services/task-sheets"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Cron endpoint — Vercel Cron hits this (see vercel.json) every 30 minutes.
 * The sync is fully automatic; this route exists only so the scheduler has a
 * URL to call. Protected by CRON_SECRET in production.
 */
export async function GET(request: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET
  const provided = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const allowed = expected ? provided === expected : process.env.NODE_ENV !== "production"
  if (!allowed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = await syncAllTaskSheets()
  const failed = results.filter((result) => !result.ok)
  return Response.json({ ok: true, synced: results.length, failed: failed.length, results })
}
