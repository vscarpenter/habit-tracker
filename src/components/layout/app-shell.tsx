"use client";

import { Sidebar, BottomNav } from "./nav-bar";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />

      {/* Main content: offset for sidebar on desktop, bottom padding for nav on mobile */}
      <main className="lg:pl-60 pb-20 lg:pb-0">{children}</main>
    </div>
  );
}
