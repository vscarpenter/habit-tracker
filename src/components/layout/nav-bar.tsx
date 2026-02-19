"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarRange,
  CalendarDays,
  ListChecks,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Mobile bottom nav: 5 items (Today, Week, Month, Stats, Settings) */
const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/week", label: "Week", icon: CalendarRange },
  { href: "/month", label: "Month", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Desktop sidebar: all 6 items */
const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/week", label: "Week", icon: CalendarRange },
  { href: "/month", label: "Month", icon: CalendarDays },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

/** Desktop sidebar navigation */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside aria-label="Main navigation" className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-60 flex-col bg-surface backdrop-blur-xl border-r border-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-text-primary">HabitFlow</h1>
        <p className="text-xs text-text-muted mt-1">Build better habits</p>
      </div>

      <nav aria-label="Primary" className="flex-1 px-3 space-y-1">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150",
                active
                  ? "bg-accent-blue/10 text-accent-blue"
                  : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Link
          href="/habits/new"
          className={cn(
            "flex items-center justify-center gap-2 w-full rounded-xl px-3 py-2.5",
            "bg-accent-blue text-white text-sm font-medium",
            "hover:bg-accent-blue/90 transition-colors duration-150"
          )}
        >
          <Plus className="h-4 w-4" />
          New Habit
        </Link>
      </div>
    </aside>
  );
}

/** Mobile bottom navigation bar */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 lg:hidden bg-surface-elevated backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-1",
                "transition-colors duration-150",
                active
                  ? "text-accent-blue"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
