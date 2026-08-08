/**
 * Demo seed: 1 PM + 3 supervisors with 10 members each.
 *
 *   admin  / admin    (Project Manager — cross-tenant, read-only)
 *   gonza  / gonza    (supervisor 1 — "Celula 5")
 *   martin / martin   (supervisor 2 — "Celula 3")
 *   diego  / diego    (supervisor 3 — "Celula 7")
 *
 * Contract:
 * - Users are UPSERTed: existing usernames keep their data but get the
 *   seeded password (so the documented credentials always work).
 * - Members are only inserted for supervisors with NO members yet — the seed
 *   never duplicates or touches existing rosters.
 * - The legacy dev PM "pm" (replaced by admin/admin) is removed.
 *
 * Run: npm run db:seed   (after npm run db:reset for a fully clean demo).
 */
import { getDb } from "../lib/db/connection"
import { hashPassword } from "../lib/auth-password"
import { insertMember } from "../lib/db/repos/members"

const PM = { id: "user-admin", username: "admin", password: "admin" }

const SUPERVISORS = [
  { id: "user-gonza", username: "gonza", password: "gonza", celula: "Celula 5" },
  { id: "user-martin", username: "martin", password: "martin", celula: "Celula 3" },
  { id: "user-diego", username: "diego", password: "diego", celula: "Celula 7" },
]

const ROSTER_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
]

/** Same roster shape for every supervisor; joined dates stagger over ~7 months. */
const ROSTER = [
  { name: "Lucía Fernández", role: "Desarrolladora", status: "active" as const, daysAgo: 210 },
  { name: "Juan Pérez", role: "Desarrollador", status: "active" as const, daysAgo: 190 },
  { name: "Sofía Gómez", role: "QA", status: "active" as const, daysAgo: 175 },
  { name: "Mateo Rodríguez", role: "Diseñador UX", status: "active" as const, daysAgo: 160 },
  { name: "Valentina López", role: "Soporte N1", status: "active" as const, daysAgo: 145 },
  { name: "Thiago Martínez", role: "Soporte N2", status: "active" as const, daysAgo: 120 },
  { name: "Camila Díaz", role: "Analista de datos", status: "active" as const, daysAgo: 95 },
  { name: "Benjamín Silva", role: "DevOps", status: "active" as const, daysAgo: 70 },
  { name: "Martina Romero", role: "Scrum Master", status: "active" as const, daysAgo: 45 },
  { name: "Joaquín Torres", role: "Líder técnico", status: "recess" as const, daysAgo: 20 },
]

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

async function upsertUser(
  client: Awaited<ReturnType<typeof getDb>>,
  user: { id: string; username: string; password: string; role: "supervisor" | "pm"; celula?: string | null },
): Promise<"created" | "refreshed"> {
  const result = await client.execute({
    sql: `INSERT INTO users (id, username, password_hash, role, celula, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT (username) DO UPDATE SET password_hash = excluded.password_hash,
                                               role = excluded.role,
                                               celula = excluded.celula`,
    args: [
      user.id,
      user.username,
      hashPassword(user.password),
      user.role,
      user.celula ?? null,
      new Date().toISOString(),
    ],
  })
  return Number(result.rowsAffected) > 0 ? "created" : "refreshed"
}

async function main() {
  const client = await getDb()

  console.log("— Usuarios —")
  const pmResult = await upsertUser(client, { ...PM, role: "pm", celula: null })
  console.log(`  pm:  ${PM.username} / ${PM.password}  (${pmResult})`)

  for (const supervisor of SUPERVISORS) {
    const result = await upsertUser(client, { ...supervisor, role: "supervisor" })
    console.log(`  sup: ${supervisor.username} / ${supervisor.password}  célula "${supervisor.celula}"  (${result})`)
  }

  // Legacy dev PM from the earlier default seed (replaced by admin/admin).
  const legacy = await client.execute("DELETE FROM users WHERE username = 'pm' AND id = 'user-pm'")
  if (Number(legacy.rowsAffected) > 0) {
    console.log("  limpio: usuario 'pm' heredado eliminado (ahora la PM es 'admin')")
  }

  console.log("— Miembros (10 por supervisor, solo si no tiene plantilla) —")
  for (const supervisor of SUPERVISORS) {
    const existing = await client.execute("SELECT COUNT(*) AS n FROM members WHERE user_id = ?", [supervisor.id])
    const count = Number((existing.rows[0] as unknown as { n: number }).n)
    if (count > 0) {
      console.log(`  ${supervisor.username}: ya tiene ${count} miembros — seed omitido`)
      continue
    }
    for (const [index, member] of ROSTER.entries()) {
      await insertMember(supervisor.id, {
        name: member.name,
        role: member.role,
        status: member.status,
        joinedAt: isoDaysAgo(member.daysAgo),
        displayColor: ROSTER_COLORS[index],
      })
    }
    console.log(`  ${supervisor.username}: 10 miembros creados`)
  }

  const totals = await client.execute(
    `SELECT u.username,
            (SELECT COUNT(*) FROM members m WHERE m.user_id = u.id) AS members
     FROM users u WHERE u.role = 'supervisor' ORDER BY u.username`,
  )
  console.log("— Resumen —")
  for (const row of totals.rows) {
    const entry = row as unknown as { username: string; members: number }
    console.log(`  ${entry.username}: ${entry.members} miembros`)
  }
  console.log("Listo. Login: admin/admin (PM) — gonza/gonza, martin/martin, diego/diego (supervisores).")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
