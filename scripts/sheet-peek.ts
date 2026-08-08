/**
 * Dev utility: "peek" a public Google Sheets CSV and list the distinct
 * values of a column (default USER) with per-value row counts.
 *
 * Usage:
 *   npm run sheet:peek -- "https://docs.google.com/spreadsheets/d/…" [COLUMN]
 *
 * Prints the exact usernames so you can copy them into the planilla member
 * mapping without typos. Read-only — never writes to the database.
 */
import { parse } from "csv-parse/sync"

import { toCsvExportUrl } from "../lib/services/task-sheets"

async function main() {
  const url = process.argv[2]
  const column = process.argv[3] ?? "USER"
  if (!url) {
    console.error('Uso: npm run sheet:peek -- "URL" [COLUMNA]\n  COLUMNA por defecto: USER')
    process.exit(1)
  }
  const exportUrl = toCsvExportUrl(url)
  if (!exportUrl) {
    console.error("La URL no es una planilla de Google Sheets válida.")
    process.exit(1)
  }

  console.log(`Descargando ${exportUrl} …`)
  const response = await fetch(exportUrl, {
    signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "Tracker-Interno/1.0" },
    cache: "no-store",
  })
  if (!response.ok) {
    console.error(`No se pudo descargar la planilla (HTTP ${response.status}).`)
    console.error("¿La hoja está publicada? Archivo → Compartir → Publicar en la web → CSV.")
    process.exit(1)
  }

  const rows = parse(await response.text(), {
    columns: true,
    trim: true,
    skip_empty_lines: true,
    skip_records_with_error: true,
    relax_column_count: true,
    bom: true,
  }) as Array<Record<string, string | undefined>>

  const counts = new Map<string, number>()
  let empty = 0
  for (const row of rows) {
    const value = (row[column] ?? "").trim()
    if (!value) {
      empty += 1
      continue
    }
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  console.log(`Filas totales: ${rows.length} · columna "${column}"`)
  if (!counts.has("") && empty === 0 && counts.size === 0 && rows.length > 0) {
    console.warn(`La columna "${column}" no existe en la planilla. Columnas disponibles: ${Object.keys(rows[0] ?? {}).join(", ")}`)
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  for (const [value, count] of sorted) {
    console.log(`  ${count.toString().padStart(6)}  ${value}`)
  }
  if (empty > 0) console.log(`  ${String(empty).padStart(6)}  (celdas vacías)`)
  console.log(`Total de valores distintos: ${sorted.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
