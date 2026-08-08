import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import "@smastrom/react-rating/style.css";
import "@excalidraw/excalidraw/index.css";
import { AppNav } from "@/components/layout/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { CommandPaletteProvider } from "@/components/feature/command-palette-provider";
import { getCurrentUserId } from "@/lib/auth";
import { getMembers } from "@/lib/services/members";
import { getAllTasks } from "@/lib/services/tasks";
import { getUserById } from "@/lib/db/repos/users";

export const metadata: Metadata = {
  title: { default: "Tracker", template: "%s · Tracker" },
  description: "Seguimiento del rendimiento del equipo — miembros, registros, tareas y ausencias.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId()

  let username = "Usuario"
  let role: "supervisor" | "pm" = "supervisor"
  let members: Awaited<ReturnType<typeof getMembers>> = []
  let tasks: Awaited<ReturnType<typeof getAllTasks>> = []

  if (userId) {
    const user = await getUserById(userId)
    username = user?.username ?? "Usuario"
    role = user?.role ?? "supervisor"
    // The PM has no roster of their own — skip preloading tenant data.
    if (user?.role !== "pm") {
      ;[members, tasks] = await Promise.all([getMembers(userId), getAllTasks(userId)])
    }
  }

  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {userId ? (
            <>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring">
                Saltar al contenido principal
              </a>
              <AppNav username={username} role={role} />
              <CommandPaletteProvider members={members} tasks={tasks} />
            </>
          ) : null}
          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6 lg:px-8">
            {children}
          </main>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
