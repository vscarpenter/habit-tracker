# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HabitFlow** — a privacy-first, offline-capable habit tracking PWA. All data lives in IndexedDB locally, with optional PocketBase cloud sync across devices. Built as a static export deployed to AWS S3 + CloudFront.

## Tech Stack

- **Framework:** Next.js 16 (App Router, `output: 'export'` for static site)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (CSS-based config via `@theme inline` in globals.css)
- **Database:** Dexie.js 4+ (IndexedDB wrapper, offline-first)
- **Validation:** Zod 4 (import from `zod/v4`; `.refine()` must be applied after `.omit()`/`.partial()`)
- **Charts:** Recharts 3.7+
- **Dates:** date-fns 4.1+
- **Icons:** Lucide React
- **Testing:** Vitest 4 + React Testing Library 16
- **Font:** Inter via `next/font/google`
- **Sync:** PocketBase (Google OAuth + record storage) — optional cloud sync via snapshot merge
- **Utilities:** clsx + tailwind-merge via `cn()` helper in `src/lib/utils.ts`

## Build & Development Commands

```bash
bun run dev            # Next.js dev server
bun run build          # Static export to out/
bun run test           # Vitest (all tests)
bunx vitest run src/db/schemas.test.ts  # Single test file
bun run test:watch     # Vitest watch mode
bun run lint           # ESLint
bun run type-check     # tsc --noEmit
```

Deploy: `aws s3 sync out/ s3://BUCKET --delete` then invalidate CloudFront.

## Architecture

### Data Layer (`src/db/`)
Three IndexedDB tables via Dexie: `Habit`, `HabitCompletion`, `UserSettings`. Every write must pass through Zod validation in `schemas.ts`. Service modules (`habit-service.ts`, `completion-service.ts`, `settings-service.ts`) are the only code that touches the database.

### Hooks (`src/hooks/`)
Domain logic lives in hooks, not components. `use-habit-stats.ts` owns all computed stats (streaks, rates, trends). Components render; hooks compute.

### Routes (App Router)
`/` (today dashboard), `/habits` (management), `/habits/new`, `/habits/[id]`, `/habits/[id]/edit`, `/stats`, `/settings`

Dynamic routes under `[id]` use a layout-level `generateStaticParams` with a placeholder ID for static export. CloudFront's 404→index.html fallback enables client-side routing to actual habit IDs.

### Sync Layer (`src/lib/sync/`)
Optional PocketBase cloud sync using snapshot merge (full `ExportData` JSON per user). Auth via Google OAuth. Key files:
- `types.ts` — `SyncStatus`, `SyncState`, `SyncUser`, `MergeResult`
- `merge.ts` — `mergeSnapshots()` (habits: LWW, completions: union, settings: LWW)
- `pocketbase-client.ts` — lazy client singleton (requires `NEXT_PUBLIC_POCKETBASE_URL`)
- `auth-service.ts` — Google OAuth sign-in/out
- `sync-service.ts` — pull/push/sync operations via `habitflow_sync_snapshots`

Design docs: `docs/sync-design.md` (option analysis), `docs/sync-supabase-plan.md` (historical Supabase plan).

### Components (`src/components/`)
- `ui/` — shadcn-inspired primitives (all accept `className` prop)
- `layout/` — AppShell, NavBar, Header
- `habits/`, `dashboard/`, `stats/`, `settings/` — feature components
- `sync/` — SyncAuthModal, SyncSection (settings page sync UI)
- `shared/` — EmptyState, ErrorBoundary, Toast, ConfirmDialog

### Test files are co-located: `component.test.tsx` beside `component.tsx`. Factories in `src/test/factories.ts`, DB mocks in `src/test/mocks/db.ts`.

## Design System

Glassmorphism: `bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20`. 4px base grid. Cards `rounded-2xl`, buttons `rounded-xl`, inputs `rounded-lg`. Eight accent colors for habit categorization. Light/dark/system theme via CSS variables in `globals.css`.

## Critical Business Rules

### Streak Calculation
- Count consecutive **scheduled** days completed (non-scheduled days don't break streaks)
- Current streak includes today if completed; if not yet completed today, show yesterday's streak (not broken until the day passes)
- Best streak = longest ever for that habit

### Completion Rate
- `completions / scheduled_days * 100` for the period
- Exclude future days and days before habit creation
- Respect frequency settings (daily, weekdays, weekends, specific_days, x_per_week)

### Date Handling
- Dates stored as `YYYY-MM-DD` strings (local date, never UTC)
- Timestamps stored as ISO 8601
- "Today" = user's local date; day boundary = local midnight
- Week boundaries respect `weekStartsOn` setting (0=Sun, 1=Mon)

### Archive vs Delete
- Archive: hidden from views, data preserved, restorable
- Delete: permanent removal of habit + all completions, requires confirmation
- Archived habits excluded from progress and statistics

### Data Limits
- Max 50 active habits (warn at 40)
- Habit name: 100 chars, description: 500 chars, note: 250 chars

## Key Conventions

- See `coding-standards.md` for full code quality standards, git workflow, testing strategy, and agentic behavior guidelines
- Conventional commits: `feat(habits): add category filtering`
- Functions ≤30 lines, files ≤400 lines, ≤3 nesting levels
- DRY after 3+ repetitions, not before
- All function signatures need type annotations; no `any` without justification comment
- Error handling: toast for DB errors ("Something went wrong. Your data is safe."), inline errors for forms, Error Boundaries at page level

## Responsive Breakpoints

- Mobile (<640px): single column, bottom nav, swipe gestures, 44x44px touch targets
- Tablet (640-1024px): two-column grids
- Desktop (>1024px): fixed 240px sidebar, multi-column grids, keyboard shortcuts active

## Implementation Phases

1. **Foundation:** Next.js scaffold, UI primitives, Dexie + Zod, app shell, PWA ✅
2. **Core:** Habit CRUD, today view, completion toggles, empty states ✅
3. **Views:** Week view, habit detail, streak engine, history ✅
4. **Stats:** Charts, analytics dashboard, heatmaps, leaderboard ✅
5. **Polish:** Export/import, settings, keyboard shortcuts, performance, deploy ✅
6. **Sync:** PocketBase cloud sync (types, merge, auth, sync service, UI components) ✅
