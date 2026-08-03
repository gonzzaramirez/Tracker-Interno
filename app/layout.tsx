import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import { AppNav } from "@/components/layout/app-nav";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Team Tracker",
    template: "%s · Team Tracker",
  },
  description:
    "Weekly team overview — members, follow-ups, tasks, feedback, snippets and time-off.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
          <AppNav />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6 lg:px-8"
          >
            {children}
          </main>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
