import { syncAllTaskSheets } from "@/lib/services/task-sheets"
import { isWorkTime } from "@/lib/domain/date"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Cron endpoint — Vercel Cron hits this (see vercel.json) every 5 minutes.
 * The sync is fully automatic; this route exists only so the scheduler has a
 * URL to call. Protected by CRON_SECRET in production.
 *
 * Work-hour gate: the client only updates the Google sheet during Argentine
 * work hours (Mon–Fri 09:00–18:00, America/Argentina/Buenos_Aires), so the
 * cron must not hit the sheet outside that window. Skipped runs answer 200
 * with { skipped: true } — no error, no sheet request.
 *
 * Manual syncs (the "Sincronizar ahora" button, create/update task) bypass
 * this gate on purpose: the supervisor may need fresh data any time.
 */
export async function GET(request: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET
  const provided = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const allowed = expected ? provided === expected : process.env.NODE_ENV !== "production"
  if (!allowed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isWorkTime(new Date())) {
    return Response.json({ ok: true, skipped: true, reason: "outside-work-hours" })
  }

  const results = await syncAllTaskSheets()
  const failed = results.filter((result) => !result.ok)
  return Response.json({ ok: true, synced: results.length, failed: failed.length, results })
}
