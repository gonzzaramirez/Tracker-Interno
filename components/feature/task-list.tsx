import type { Member, TaskWithProgress } from "@/lib/domain"
import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { TaskRow } from "@/components/feature/task-row"
import { StatusBadge } from "@/components/feature/status-badge"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CheckCircle2Icon } from "lucide-react"

export type MemberTaskGroup = {
  member: Member
  active: TaskWithProgress[]
  done: TaskWithProgress[]
}

type TaskListProps = {
  groups: MemberTaskGroup[]
  members: Member[]
}

/**
 * Tasks grouped by member with a separate "done" group (REQ-TT-001,
 * REQ-TT-004). Renders the Apple card per member with tasks.
 */
export function TaskList({ groups, members }: TaskListProps) {
  return (
    <div className="space-y-6">
      {groups.map(({ member, active, done }) => (
        <AppleCard key={member.id}>
          <AppleCardHeader>
            <div className="flex items-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                aria-hidden
              >
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <AppleCardTitle>{member.name}</AppleCardTitle>
                  <StatusBadge status={member.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {member.role} · {active.length} active
                  {done.length > 0 ? `, ${done.length} done` : ""}
                </p>
              </div>
            </div>
          </AppleCardHeader>

          {active.length === 0 && done.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2Icon />
                </EmptyMedia>
                <EmptyTitle>No tasks assigned</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>
                  Create a task for {member.name.split(" ")[0]} to get started.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y divide-foreground/5">
              {active.map((task) => (
                <TaskRow key={task.task.id} taskWithProgress={task} members={members} />
              ))}
            </div>
          )}

          {done.length > 0 ? (
            <div className="divide-y divide-foreground/5 border-t border-foreground/5 pt-1">
              <p className="px-1 pt-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Completed
              </p>
              {done.map((task) => (
                <TaskRow key={task.task.id} taskWithProgress={task} members={members} />
              ))}
            </div>
          ) : null}
        </AppleCard>
      ))}
    </div>
  )
}
