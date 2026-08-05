"use client"

import { useState } from "react"

import { AttendanceForm } from "@/components/feature/attendance-form"
import { AttendanceList } from "@/components/feature/attendance-list"
import type { Attendance, Member } from "@/lib/domain"
import type { AttendanceLogEntry } from "@/lib/services/attendance"

type AttendanceLogProps = {
  members: Member[]
  marks: Attendance[]
}

/**
 * The full attendance log: a list of every mark with inline edit. Editing
 * swaps the row into the shared AttendanceForm prefilled.
 */
export function AttendanceLog({ members, marks }: AttendanceLogProps) {
  const [editing, setEditing] = useState<Attendance | null>(null)

  const rows = members
    .filter((m) => marks.some((a) => a.memberId === m.id))
    .flatMap((m) =>
      marks
        .filter((a) => a.memberId === m.id)
        .map((attendance) => ({ member: m, attendance })),
    )

  const editingEntry = editing
    ? rows.find((row) => row.attendance.id === editing.id)
    : undefined

  return (
    <div className="space-y-4">
      {editingEntry ? (
        <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
          <AttendanceForm
            members={members}
            attendance={editingEntry.attendance}
            onDone={() => setEditing(null)}
          />
        </div>
      ) : null}
      <AttendanceList rows={rows} onEdit={setEditing} />
    </div>
  )
}
