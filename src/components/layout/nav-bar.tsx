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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
}

/** Mobile bottom nav: 5 items (Today, Week, Month, Stats, Settings) */
const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck, accent: "var(--chart-2)" },
  { href: "/week", label: "Week", icon: CalendarRange, accent: "var(--chart-1)" },
  { href: "/month", label: "Month", icon: CalendarDays, accent: "var(--chart-5)" },
  { href: "/stats", label: "Stats", icon: BarChart3, accent: "var(--chart-3)" },
  { href: "/settings", label: "Settings", icon: Settings, accent: "var(--chart-4)" },
];

/** Desktop sidebar: all 6 items */
const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck, accent: "var(--chart-2)" },
  { href: "/week", label: "Week", icon: CalendarRange, accent: "var(--chart-1)" },
  { href: "/month", label: "Month", icon: CalendarDays, accent: "var(--chart-5)" },
  { href: "/habits", label: "Habits", icon: ListChecks, accent: "var(--accent-emerald)" },
  { href: "/stats", label: "Stats", icon: BarChart3, accent: "var(--chart-3)" },
  { href: "/settings", label: "Settings", icon: Settings, accent: "var(--chart-4)" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

/** Desktop sidebar navigation */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Main navigation"
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-surface-overlay/85 backdrop-blur-2xl lg:flex"
    >
      <div className="px-4 pb-2 pt-4">
        <Link
          href="/"
          className="hf-panel-strong block rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={36}
              height={36}
              className="rounded-xl shadow-[0_10px_20px_-14px_var(--accent-blue)]"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-text-primary">HabitFlow</p>
              <p className="text-xs text-text-muted">Warm editorial mode</p>
            </div>
          </div>
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1.5 px-3 py-2">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium",
                "transition-all duration-200",
                active
                  ? "border-border-subtle bg-surface-paper text-text-primary shadow-[var(--shadow-editorial-sm)]"
                  : "border-transparent text-text-secondary hover:border-border hover:bg-surface-tint/70 hover:text-text-primary"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                )}
                style={{ backgroundColor: item.accent }}
              />
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200",
                  active ? "animate-nav-pop bg-surface-tint/80" : "group-hover:bg-surface-tint/80"
                )}
              >
                <Icon className="h-4 w-4" style={active ? { color: item.accent } : undefined} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 p-3">
        <Link
          href="/habits/new"
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5",
            "border border-white/20 bg-accent-blue text-sm font-medium text-white shadow-[0_16px_28px_-18px_var(--accent-blue)]",
            "transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          )}
        >
          <Plus className="h-4 w-4" />
          New Habit
        </Link>
        <p className="px-1 text-[11px] text-text-muted">
          Tip: press <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Cmd</kbd>
          {" + "}
          <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
        </p>
      </div>
    </aside>
  );
}

/** Mobile bottom navigation bar */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="safe-area-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <div className="pointer-events-auto mx-3 mb-3 rounded-2xl border border-border-subtle bg-surface-strong/95 p-2 shadow-[0_20px_44px_-28px_rgba(20,16,10,0.72)] backdrop-blur-2xl">
        <div className="grid h-16 grid-cols-5 items-center gap-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-full min-w-[54px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium",
                  "transition-all duration-200",
                  active
                    ? "bg-surface-paper/90 text-text-primary shadow-[var(--shadow-editorial-sm)]"
                    : "text-text-secondary/85 hover:text-text-primary"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-2 right-2 top-1 h-0.5 rounded-full transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0"
                  )}
                  style={{ backgroundColor: item.accent }}
                />
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                    active ? "animate-nav-pop bg-surface-tint/75 shadow-sm" : "group-hover:bg-surface"
                  )}
                >
                  <Icon className="h-4 w-4" style={active ? { color: item.accent } : undefined} />
                </span>
                <span className={cn("leading-none tracking-[-0.01em]", active && "-translate-y-0.5")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
