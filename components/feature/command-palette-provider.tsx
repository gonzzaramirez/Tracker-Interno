"use client"

import { CommandPalette } from "@/components/feature/command-palette"
import type { Member, Task } from "@/lib/domain"

/**
 * Client wrapper that mounts the global ⌘K palette. Data comes from the
 * server layout so the palette never fetches on its own.
 */
export function CommandPaletteProvider({
  members,
  tasks,
}: {
  members: Member[]
  tasks: Task[]
}) {
  return <CommandPalette members={members} tasks={tasks} />
}
