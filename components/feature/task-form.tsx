"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks"
import type { Member, Task, TaskPriority } from "@/lib/domain"

type TaskFormProps = {
  members: Member[]
  /** When provided the form edits this task, otherwise it creates one. */
  task?: Task
  /** Called after a successful submit (used to close inline editors). */
  onClose?: () => void
}

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

/**
 * Create/edit task form (REQ-TT-002) bound to a Server Action; mutations are
 * echoed in-session after revalidation.
 */
export function TaskForm({ members, task, onClose }: TaskFormProps) {
  const [memberId, setMemberId] = useState(task?.memberId ?? members[0]?.id ?? "")
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createTaskAction({
        memberId,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
        priority,
        dueDate: String(formData.get("dueDate") ?? "") || undefined,
      })
      if (result.ok) {
        toast.success("Task created")
        formRef.current?.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  function submitUpdate(formData: FormData) {
    if (!task) {
      return
    }
    startTransition(async () => {
      const result = await updateTaskAction(task.id, {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
        priority,
        dueDate: String(formData.get("dueDate") ?? "") || undefined,
      })
      if (result.ok) {
        toast.success("Task updated")
        onClose?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={task ? submitUpdate : submitCreate}
      className="grid gap-4 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          name="title"
          required
          defaultValue={task?.title}
          placeholder="What needs to get done?"
        />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          name="description"
          defaultValue={task?.description ?? ""}
          placeholder="Optional context for the task"
          rows={2}
        />
      </div>

      {!task ? (
        <div className="flex flex-col gap-1.5">
          <Label>Member</Label>
          <Select value={memberId} onValueChange={(value) => setMemberId(value ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label>Priority</Label>
        <Select
          value={priority}
          onValueChange={(value) => setPriority((value ?? "medium") as TaskPriority)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-duedate">Due date</Label>
        <Input
          id="task-duedate"
          name="dueDate"
          type="date"
          defaultValue={task?.dueDate ?? ""}
        />
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending || !memberId}>
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : task ? (
            "Save changes"
          ) : (
            "Create task"
          )}
        </Button>
        {onClose ? (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}