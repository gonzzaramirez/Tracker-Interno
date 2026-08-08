"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDaysIcon,
  CheckSquareIcon,
  FingerprintIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LogOutIcon,
  MessageSquareTextIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { signOutAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/lib/domain"

const NAV_ITEMS = [
  { href: "/", label: "Panel", icon: LayoutDashboardIcon, exact: true },
  { href: "/members", label: "Miembros", icon: UsersIcon },
  { href: "/asistencias", label: "Asistencias", icon: FingerprintIcon },
  { href: "/tracking", label: "Seguimiento", icon: MessageSquareTextIcon },
  { href: "/boards", label: "Pizarras", icon: LayoutGridIcon },
  { href: "/tasks", label: "Tareas", icon: CheckSquareIcon },
  { href: "/goals", label: "Objetivos", icon: TargetIcon },
  { href: "/calendar", label: "Calendario", icon: CalendarDaysIcon },
] as const

/** The PM account has a single purpose: read every supervisor's team. */
const PM_NAV_ITEMS = [
  { href: "/pm", label: "Supervisores", icon: UsersIcon, exact: true },
] as const

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav({ username, role }: { username: string; role: UserRole }) {
  const pathname = usePathname()
  const items = role === "pm" ? PM_NAV_ITEMS : NAV_ITEMS

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/5 bg-background/70 backdrop-blur-xl">
      <nav aria-label="Navegación principal" className="mx-auto flex w-full max-w-5xl items-center gap-1 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Inicio" className="mr-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <LayoutDashboardIcon className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Tracker</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = isActive(pathname, item.href, "exact" in item && item.exact)
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:px-3",
                  active && "bg-foreground/5 text-foreground",
                )}>
                <item.icon className="size-4" aria-hidden="true" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/profile" className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:px-3">
            <KeyRoundIcon className="size-4" aria-hidden />
            <span className="hidden lg:inline">{username}</span>
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión">
              <LogOutIcon className="size-4" />
            </Button>
          </form>
        </div>
      </nav>
    </header>
  )
}
