/**
 * Mock members repo — async read access to the in-memory store.
 */

import type { Member } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"

export async function listMembers(): Promise<Member[]> {
  await delay()
  return [...getDb().members]
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  await delay()
  return getDb().members.find((member) => member.id === id)
}