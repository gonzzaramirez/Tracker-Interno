"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDaysIcon,
  CheckSquareIcon,
  Code2Icon,
  MessageSquareTextIcon,
  LayoutDashboardIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { href: "/members", label: "Members", icon: UsersIcon },
  { href: "/tasks", label: "Tasks", icon: CheckSquareIcon },
  { href: "/feedback", label: "Feedback", icon: MessageSquareTextIcon },
  { href: "/snippets", label: "Snippets", icon: Code2Icon },
  { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon },
] as const

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/5 bg-background/70 backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex w-full max-w-5xl items-center gap-1 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="mr-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <LayoutDashboardIcon className="size-4" />
          </span>
          <span className="hidden sm:inline">Team Tracker</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, "exact" in item && item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-foreground/5 text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
