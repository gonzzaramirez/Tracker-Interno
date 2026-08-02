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

export async function insertTimeOff(entry: TimeOffEntry): Promise<TimeOffEntry> {
  await delay()
  getDb().timeOff.push(entry)
  return entry
}