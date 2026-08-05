"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDaysIcon,
  CheckSquareIcon,
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Member, Task } from "@/lib/domain"

const NAV_ENTRIES = [
  { id: "nav-panel", href: "/", label: "Panel", icon: LayoutDashboardIcon },
  { id: "nav-members", href: "/members", label: "Miembros", icon: UsersIcon },
  { id: "nav-tracking", href: "/tracking", label: "Seguimiento", icon: MessageSquareTextIcon },
  { id: "nav-tasks", href: "/tasks", label: "Tareas", icon: CheckSquareIcon },
  { id: "nav-calendar", href: "/calendar", label: "Calendario", icon: CalendarDaysIcon },
] as const

type CommandPaletteProps = {
  members: Member[]
  tasks: Task[]
}

/**
 * Global command palette (⌘K / Ctrl+K). Searches navigation, members and
 * tasks; selecting an entry navigates instantly.
 */
export function CommandPalette({ members, tasks }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  const memberItems = useMemo(
    () =>
      members.map((member) => ({
        id: `member-${member.id}`,
        label: member.name,
        hint: member.role,
        href: `/members/${member.id}`,
      })),
    [members],
  )

  const taskItems = useMemo(
    () =>
      tasks.map((task) => ({
        id: `task-${task.id}`,
        label: task.title,
        hint: "Tarea",
        href: `/tasks`,
      })),
    [tasks],
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Buscador" description="Buscá y navegá rápido">
      <CommandInput placeholder="Buscá miembros, tareas o navegá…" />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        <CommandGroup heading="Navegación">
          {NAV_ENTRIES.map((entry) => (
            <CommandItem
              key={entry.id}
              value={`${entry.label} ${entry.href}`}
              onSelect={() => go(entry.href)}
            >
              <entry.icon className="size-4" aria-hidden />
              {entry.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {memberItems.length > 0 ? (
          <CommandGroup heading="Miembros">
            {memberItems.map((item) => (
              <CommandItem key={item.id} value={`${item.label} ${item.hint}`} onSelect={() => go(item.href)}>
                <UsersIcon className="size-4" aria-hidden />
                {item.label}
                <span className="ml-auto text-xs text-muted-foreground">{item.hint}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {taskItems.length > 0 ? (
          <CommandGroup heading="Tareas">
            {taskItems.map((item) => (
              <CommandItem key={item.id} value={`${item.label} ${item.hint}`} onSelect={() => go(item.href)}>
                <CheckSquareIcon className="size-4" aria-hidden />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{item.hint}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
