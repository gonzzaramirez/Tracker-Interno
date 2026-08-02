/**
 * Mock time-off repo — async read/write access to the in-memory store.
 */

import type { TimeOffEntry } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"

export async function listTimeOff(): Promise<TimeOffEntry[]> {
  await delay()
  return [...getDb().timeOff]
}

export async function listTimeOffByMember(memberId: string): Promise<TimeOffEntry[]> {
  await delay()
  return getDb().timeOff.filter((entry) => entry.memberId === memberId)
}

export async function insertTimeOff(input: Omit<TimeOffEntry, "id">): Promise<TimeOffEntry> {
  await delay()
  const db = getDb()
  const entry: TimeOffEntry = {
    ...input,
    id: `to-${db.counters.timeoff}`,
  }
  db.counters.timeoff += 1
  db.timeOff.push(entry)
  return entry
}