/**
 * Clear all tasks (and their sheet-sync data) for a clean import test.
 *
 * Deletes, in dependency order:
 *   - task_progress        (FK to tasks, CASCADE anyway — explicit for clarity)
 *   - task_daily_stats     (sheet sync counts)
 *   - task_sheet_members   (sheet user ↔ member mapping)
 *   - task_goals           (sheet goals)
 *   - tasks                (including sheet_url, last_synced_at, last_sync_error)
 *
 * Does NOT touch: users, members, boards, attendance, tracking, or goals
 * (the manual-goals table was dropped in migration 022).
 *
 * Run: npm run db:clear-tasks
 */
import { getDb } from "../lib/db/connection"

async function count(client: Awaited<ReturnType<typeof getDb>>, sql: string): Promise<number> {
  const result = await client.execute(`SELECT COUNT(*) AS n FROM ${sql}`)
  return Number((result.rows[0] as unknown as { n: number }).n)
}

async function main() {
  const client = await getDb()

  console.log("— Tareas antes del clear —")
  console.log(`  tasks: ${await count(client, "tasks")} (${await count(client, "tasks WHERE sheet_url IS NOT NULL")} con planilla vinculada)`)
  console.log(`  task_daily_stats: ${await count(client, "task_daily_stats")}`)
  console.log(`  task_sheet_members: ${await count(client, "task_sheet_members")}`)
  console.log(`  task_goals: ${await count(client, "task_goals")}`)

  const order = [
    ["task_progress", "task_progress"],
    ["task_daily_stats", "task_daily_stats"],
    ["task_sheet_members", "task_sheet_members"],
    ["task_goals", "task_goals"],
    ["tasks", "tasks"],
  ] as const

  console.log("— Borrando —")
  for (const [label, table] of order) {
    const before = await count(client, table)
    await client.execute(`DELETE FROM ${table}`)
    console.log(`  ${label}: ${before} filas eliminadas`)
  }

  console.log("— Resumen —")
  console.log(`  tasks restantes: ${await count(client, "tasks")}`)
  console.log("Listo. Las tareas y su data de planilla quedaron vacías para probar la importación.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
