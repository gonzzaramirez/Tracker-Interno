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
          <AppNav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}