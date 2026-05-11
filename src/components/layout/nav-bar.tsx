"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
import { springGentle, springSnappy, buttonInteraction } from "@/components/shared/motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/week", label: "Week", icon: CalendarRange },
  { href: "/month", label: "Month", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

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

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...springGentle, delay: 0.04 * i },
  }),
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Main navigation"
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-300 bg-paper lg:flex"
    >
      <div className="px-4 pb-4 pt-5">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="HabitFlow"
            width={36}
            height={36}
            className="rounded-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-serif text-base font-medium tracking-tight text-slate">
              HabitFlow
            </p>
            <p className="font-mono text-eyebrow uppercase tracking-[0.12em] text-gray-500">
              Consistency wins
            </p>
          </div>
        </Link>
      </div>

      <hr className="mx-4 border-0 border-t border-gray-100" />

      <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-3">
        {SIDEBAR_NAV_ITEMS.map((item, i) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              variants={navItemVariants}
              initial="hidden"
              animate="show"
              custom={i}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={springSnappy}
            >
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-sm px-3 py-2 text-small font-medium",
                  "transition-[background-color,color] duration-150",
                  active
                    ? "bg-accent-tint text-accent"
                    : "text-gray-700 hover:bg-gray-100 hover:text-slate"
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-accent"
                  />
                )}
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-gray-100 p-3">
        <motion.div {...buttonInteraction}>
          <Link
            href="/habits/new"
            className="btn btn-primary w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Habit
          </Link>
        </motion.div>
        <p className="px-1 font-mono text-eyebrow uppercase tracking-[0.12em] text-gray-500">
          <kbd>Cmd</kbd> <kbd>K</kbd>
        </p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="safe-area-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springGentle, delay: 0.2 }}
        className="pointer-events-auto mx-3 mb-3 rounded-md border border-gray-300 bg-paper p-1.5 shadow-md"
      >
        <div className="grid h-14 grid-cols-5 items-center gap-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-full flex-col items-center justify-center gap-1 rounded-sm px-1 text-eyebrow font-medium uppercase tracking-[0.06em]",
                  "transition-colors duration-150",
                  active
                    ? "text-accent"
                    : "text-gray-700 hover:text-slate"
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-3 right-3 top-0.5 h-[2px] rounded-full bg-accent"
                  />
                )}
                <Icon className="h-4 w-4" aria-hidden />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
}
