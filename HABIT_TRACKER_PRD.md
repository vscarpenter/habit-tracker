# Habit Tracker PRD

## Product Requirements Document

**Product Name:** HabitFlow
**Version:** 1.0
**Author:** Vinny Carpenter
**Date:** February 15, 2026

---

## 1. Product Overview

### 1.1 Vision

HabitFlow is a privacy-first, offline-capable habit tracking web application that helps users build and maintain positive daily habits. The app provides a beautiful, modern interface with dashboard-inspired layouts, frosted glass effects, and systematic data visualization to make habit tracking feel effortless and rewarding.

### 1.2 Core Principles

- **Privacy First:** All data stored locally in IndexedDB. No server, no accounts, no data collection.
- **Offline Capable:** Full PWA with service worker. Works without internet after first load.
- **Simplicity:** Minimal friction to log a habit. One tap/click to mark complete.
- **Visual Delight:** Modern glassmorphism design with smooth animations, depth, and geometric precision.
- **Responsive:** Equally excellent experience on desktop browsers and mobile devices.

### 1.3 Target Users

- Individuals seeking to build consistent daily routines
- Users who value privacy and local-first data storage
- People who want a clean, distraction-free habit tracking experience

---

## 2. Tech Stack

- **Framework:** Next.js 14+ (App Router, static export via `output: 'export'`)
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS 3.4+
- **UI Components:** Custom shadcn-inspired primitives (Button, Card, Dialog, Dropdown, Toggle, Tooltip, Progress, Badge, Tabs, Sheet)
- **Database:** Dexie.js 4+ (IndexedDB wrapper)
- **Validation:** Zod schemas for all data models
- **Testing:** Vitest + React Testing Library
- **PWA:** Custom service worker + web app manifest
- **Data Visualization:** Recharts 3.2+ (charts, heatmaps, streaks)
- **Date Utilities:** date-fns 4.1+ (date math, formatting, locale support)
- **Animation:** Tailwind CSS transitions + CSS keyframe animations (no heavy animation libraries)
- **Icons:** Lucide React
- **Deployment:** AWS S3 (static hosting) + CloudFront (CDN, HTTPS, caching)

---

## 3. Design System

### 3.1 Visual Language

The design follows a **modern dashboard aesthetic** with these characteristics:

- **Frosted Glass (Glassmorphism):** Cards and panels use `backdrop-blur-xl` with semi-transparent backgrounds (`bg-white/70 dark:bg-slate-900/70`) and subtle borders (`border-white/20`)
- **Layered Depth:** Multiple elevation levels using shadows and translucent overlays. Cards float above the background with `shadow-lg` and `shadow-xl`.
- **Geometric Typography:** Clean sans-serif font stack. Use Inter (primary) loaded via `next/font/google`. Precise type scale with consistent line heights.
- **Systematic Grid:** 4px base unit. All spacing uses multiples of 4. Layout grid uses 12-column system on desktop, collapsing to single column on mobile.
- **Precise Alignment:** All elements snap to the grid. Labels, values, and icons align on consistent baselines.
- **Organized Data Displays:** Stats, streaks, and completion data presented in structured card grids with clear hierarchy.

### 3.2 Color Palette

```
// Light Mode
--background: #f8fafc (slate-50)
--surface: rgba(255, 255, 255, 0.70)
--surface-elevated: rgba(255, 255, 255, 0.85)
--text-primary: #0f172a (slate-900)
--text-secondary: #475569 (slate-600)
--text-muted: #94a3b8 (slate-400)
--border: rgba(255, 255, 255, 0.20)
--border-subtle: #e2e8f0 (slate-200)

// Dark Mode
--background: #020617 (slate-950)
--surface: rgba(15, 23, 42, 0.70)
--surface-elevated: rgba(15, 23, 42, 0.85)
--text-primary: #f8fafc (slate-50)
--text-secondary: #94a3b8 (slate-400)
--text-muted: #475569 (slate-600)
--border: rgba(255, 255, 255, 0.10)
--border-subtle: #1e293b (slate-800)

// Accent Colors (for habit categories)
--accent-blue: #3b82f6
--accent-emerald: #10b981
--accent-violet: #8b5cf6
--accent-amber: #f59e0b
--accent-rose: #f43f5e
--accent-cyan: #06b6d4
--accent-orange: #f97316
--accent-pink: #ec4899

// Semantic Colors
--success: #22c55e (green-500)
--warning: #eab308 (yellow-500)
--error: #ef4444 (red-500)
--info: #3b82f6 (blue-500)
```

### 3.3 Typography Scale

```
Font: Inter (loaded via next/font/google)
Fallback: system-ui, -apple-system, sans-serif

--text-xs: 0.75rem / 1rem (12px / 16px)
--text-sm: 0.875rem / 1.25rem (14px / 20px)
--text-base: 1rem / 1.5rem (16px / 24px)
--text-lg: 1.125rem / 1.75rem (18px / 28px)
--text-xl: 1.25rem / 1.75rem (20px / 28px)
--text-2xl: 1.5rem / 2rem (24px / 32px)
--text-3xl: 1.875rem / 2.25rem (30px / 36px)
--text-4xl: 2.25rem / 2.5rem (36px / 40px)

Font Weights:
- Regular (400): Body text
- Medium (500): Labels, navigation
- Semibold (600): Headings, stats
- Bold (700): Hero numbers, emphasis
```

### 3.4 Spacing and Layout

```
Base Unit: 4px
Spacing Scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 (Tailwind defaults)

Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
Card Padding: p-4 sm:p-6
Card Gap: gap-4 sm:gap-6
Section Gap: space-y-6 sm:space-y-8
Card Border Radius: rounded-2xl
Button Border Radius: rounded-xl
Input Border Radius: rounded-lg
```

### 3.5 Component Patterns

All custom UI components should follow these patterns:

```typescript
// Every component should:
// 1. Accept className for style overrides
// 2. Forward refs where appropriate
// 3. Use CSS variables for theming
// 4. Include proper ARIA attributes
// 5. Support keyboard navigation
// 6. Use Tailwind for all styling

// Example: Glass Card Component Pattern
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
  children: React.ReactNode;
}
```

### 3.6 Animation Guidelines

```
// Transitions
--transition-fast: 150ms ease
--transition-base: 200ms ease
--transition-slow: 300ms ease

// Use for:
- Hover states: transition-colors duration-150
- Layout shifts: transition-all duration-200
- Modal/sheet enter: duration-300 ease-out
- Modal/sheet exit: duration-200 ease-in
- Habit completion: scale bounce animation (200ms)

// Avoid:
- Animations longer than 500ms
- Layout-triggering animations (use transform/opacity only)
- Animations that block interaction
```

---

## 4. Data Architecture

### 4.1 Database Schema (Dexie / IndexedDB)

```typescript
// Database: HabitFlowDB
// Version: 1

interface Habit {
  id: string;                    // UUID v4
  name: string;                  // max 100 chars
  description?: string;          // max 500 chars, optional
  icon: string;                  // emoji character (e.g., "🏃")
  color: string;                 // hex color from accent palette
  frequency: HabitFrequency;     // daily, weekdays, weekends, specific_days, x_per_week
  targetDays?: number[];         // 0=Sun, 1=Mon, ..., 6=Sat (for specific_days)
  targetCount?: number;          // for x_per_week frequency
  reminderTime?: string;         // HH:mm format, optional
  category?: string;             // user-defined category string
  sortOrder: number;             // integer for custom ordering
  isArchived: boolean;           // soft delete
  createdAt: string;             // ISO 8601 datetime
  updatedAt: string;             // ISO 8601 datetime
}

type HabitFrequency =
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'specific_days'
  | 'x_per_week';

interface HabitCompletion {
  id: string;                    // UUID v4
  habitId: string;               // FK to Habit.id
  date: string;                  // YYYY-MM-DD format (local date)
  completedAt: string;           // ISO 8601 datetime
  note?: string;                 // optional note, max 250 chars
}

interface UserSettings {
  id: string;                    // always "user_settings" (singleton)
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: 0 | 1;          // 0=Sunday, 1=Monday
  showStreaks: boolean;
  showCompletionRate: boolean;
  defaultView: 'today' | 'week' | 'month';
  createdAt: string;
  updatedAt: string;
}

// Dexie Table Indexes
// habits: id, sortOrder, isArchived, category, createdAt
// completions: id, habitId, date, [habitId+date] (compound)
// settings: id
```

### 4.2 Zod Validation Schemas

Create Zod schemas that exactly mirror the TypeScript interfaces above. All data entering or leaving the database must be validated. Schemas should include:

- String length limits
- Enum validation for frequency types
- Date format validation (ISO 8601 and YYYY-MM-DD)
- UUID format validation
- Color hex validation
- Time format validation (HH:mm)

### 4.3 Data Access Layer

Create a `db/` module that exports:

- `db` - Dexie database instance
- `habitService` - CRUD operations for habits
- `completionService` - CRUD operations for completions
- `settingsService` - read/write for user settings
- All service methods should validate inputs with Zod before database operations
- All service methods should be async and return typed results

---

## 5. Application Structure

### 5.1 Route Structure (App Router)

```
app/
  layout.tsx          // Root layout: fonts, theme provider, PWA meta
  page.tsx            // Dashboard (default view: Today)
  habits/
    page.tsx          // Habit management list
    new/
      page.tsx        // Create new habit form
    [id]/
      page.tsx        // Habit detail + history view
      edit/
        page.tsx      // Edit habit form
  stats/
    page.tsx          // Statistics and analytics dashboard
  settings/
    page.tsx          // App settings
```

### 5.2 Component Architecture

```
components/
  ui/                          // Primitive UI components
    button.tsx
    card.tsx
    dialog.tsx
    dropdown-menu.tsx
    input.tsx
    label.tsx
    progress.tsx
    badge.tsx
    tabs.tsx
    toggle.tsx
    tooltip.tsx
    sheet.tsx                   // Mobile slide-up panel
    separator.tsx
    skeleton.tsx
    switch.tsx
    textarea.tsx
    calendar.tsx               // Mini calendar component
  layout/
    app-shell.tsx              // Main layout wrapper
    nav-bar.tsx                // Bottom nav (mobile) / side nav (desktop)
    header.tsx                 // Page header with title and actions
    page-container.tsx         // Consistent page padding/width
  habits/
    habit-card.tsx             // Individual habit display with toggle
    habit-list.tsx             // List of habit cards for a given day
    habit-form.tsx             // Create/edit habit form
    habit-detail-header.tsx    // Detail page header with stats
    habit-history-calendar.tsx // Calendar heatmap of completions
    habit-streak-display.tsx   // Current/best streak display
    completion-toggle.tsx      // The main tap-to-complete interaction
    category-filter.tsx        // Filter habits by category
    sort-controls.tsx          // Reorder habits
  dashboard/
    today-view.tsx             // Today's habits with progress
    week-view.tsx              // 7-day overview grid
    daily-progress-ring.tsx    // Circular progress for today
    streak-summary.tsx         // Overview of all streaks
    quick-stats-grid.tsx       // Grid of stat cards
  stats/
    completion-chart.tsx       // Line/bar chart of completions over time
    habit-heatmap.tsx          // GitHub-style contribution heatmap
    category-breakdown.tsx     // Pie/donut chart by category
    streak-leaderboard.tsx     // Ranked list of habits by streak
    weekly-trend.tsx           // Week-over-week comparison
    stats-date-range.tsx       // Date range selector for stats
  settings/
    theme-toggle.tsx           // Light/dark/system toggle
    week-start-picker.tsx      // Sunday/Monday picker
    data-management.tsx        // Export/import/clear data
    about-section.tsx          // App info and version
  shared/
    empty-state.tsx            // Illustrated empty states
    loading-skeleton.tsx       // Skeleton loaders for each section
    error-boundary.tsx         // Error boundary with retry
    confirm-dialog.tsx         // Reusable confirmation modal
    toast.tsx                  // Toast notification system
```

### 5.3 Custom Hooks

```
hooks/
  use-habits.ts               // CRUD operations, returns habits list
  use-completions.ts           // Toggle completion, query by date range
  use-habit-stats.ts           // Computed stats: streaks, rates, trends
  use-settings.ts              // Read/write user settings
  use-theme.ts                 // Theme management (light/dark/system)
  use-today.ts                 // Current date, refreshes at midnight
  use-date-range.ts            // Date range selection state
  use-media-query.ts           // Responsive breakpoint detection
  use-keyboard-shortcut.ts     // Global keyboard shortcuts
```

---

## 6. Feature Specifications

### 6.1 Dashboard (Today View) - Default Page

**Purpose:** Show today's habits and provide one-tap completion.

**Layout:**
- Header: "Today" with formatted date (e.g., "Saturday, February 15"), greeting based on time of day
- Daily Progress Ring: Large circular progress indicator showing X of Y habits completed today
- Quick Stats Row: 3 stat cards in a row: "Current Streak" (best active), "Today's Progress" (percentage), "This Week" (weekly completion rate)
- Habit List: Vertical list of habit cards for today, sorted by user-defined order
- Each habit card shows: icon, name, completion toggle (large tap target, min 44x44px), streak count badge
- Completed habits show a subtle checkmark animation and reduced opacity
- Bottom: Motivational message when all habits are complete

**Interactions:**
- Tap/click the completion toggle to mark a habit done (single tap, no confirmation needed)
- Tap again to undo completion
- Long press / right click on a habit card opens quick actions (edit, view history, archive)
- Pull-to-refresh gesture on mobile (re-renders the view)
- Swipe left on a habit card to reveal "Skip" and "Archive" actions (mobile)

**Empty State:**
- When no habits exist: Illustration with "Start building better habits" message and prominent "Create Your First Habit" button

### 6.2 Week View

**Purpose:** Show a 7-day overview of all habits.

**Layout:**
- Header row: 7 columns for each day of the week (respects weekStartsOn setting)
- Today's column is highlighted with accent border
- Each column shows the day abbreviation and date number
- Grid rows: One row per active habit
- Each cell: Small completion indicator (filled circle = done, empty circle = not done, dash = not scheduled)
- Row header: Habit icon and name (sticky on horizontal scroll for mobile)

**Interactions:**
- Tap any cell to toggle completion for that habit on that day
- Tap habit name to navigate to habit detail
- Swipe horizontally to navigate between weeks (mobile)
- Arrow buttons or keyboard arrows to navigate weeks (desktop)

### 6.3 Habit Management

#### 6.3.1 Create Habit

**Form Fields:**
1. **Name** (required): Text input, max 100 chars, auto-focus on mount
2. **Description** (optional): Textarea, max 500 chars
3. **Icon**: Emoji picker. Show a grid of 40+ common habit emojis (fitness, food, mind, social, work, creative categories). Allow custom emoji input.
4. **Color**: Color picker showing the 8 accent colors as selectable circles
5. **Frequency**: Radio group:
   - Every day
   - Weekdays (Mon-Fri)
   - Weekends (Sat-Sun)
   - Specific days (show day-of-week multi-select: S M T W T F S)
   - X times per week (show number input 1-7)
6. **Reminder Time** (optional): Time picker (HH:MM)
7. **Category** (optional): Combobox with existing categories + ability to type new

**Validation:**
- Name is required and must be 1-100 characters
- At least one day must be selected for specific_days frequency
- targetCount must be 1-7 for x_per_week
- Show inline validation errors below each field

**Submit:**
- "Create Habit" button (primary, full-width on mobile)
- On success: Navigate to dashboard with toast "Habit created!"
- On validation error: Scroll to first error, focus the field

#### 6.3.2 Edit Habit

- Same form as Create but pre-populated
- Additional "Archive Habit" button (destructive variant) at bottom
- "Save Changes" button
- Archiving shows a confirmation dialog: "Archive [habit name]? You can restore it later from settings."

#### 6.3.3 Habit List / Management Page

- Shows all habits (active first, then archived in collapsed section)
- Drag-and-drop reordering (or move up/down buttons for accessibility)
- Each row: icon, name, frequency badge, streak count, kebab menu (edit, archive/restore, delete)
- Delete shows confirmation: "Permanently delete [habit name]? This will remove all completion history. This cannot be undone."
- Search/filter bar at top

### 6.4 Habit Detail Page

**Purpose:** Deep dive into a single habit's history and statistics.

**Layout:**
- Header: Habit icon, name, description, frequency badge, color accent bar
- Stats Grid (2x2):
  - Current Streak (number + "days" label)
  - Best Streak (number + "days" label)
  - Total Completions (number)
  - Completion Rate (percentage, based on scheduled days)
- Calendar Heatmap: GitHub-style contribution calendar showing the last 6 months. Color intensity represents completions. Scrollable horizontally on mobile.
- Monthly Completion Chart: Recharts bar chart showing completions per month (last 6 months)
- Weekly Pattern: Small chart showing which days of the week the habit is most/least completed
- Recent History: List of last 14 days with completion status, date, and any notes
- Edit button in header

### 6.5 Statistics Page

**Purpose:** Aggregate analytics across all habits.

**Layout:**
- Date Range Selector: Preset buttons (7D, 30D, 90D, 1Y, All) + custom range picker
- Overall Stats Row:
  - Total Active Habits
  - Overall Completion Rate (for selected period)
  - Best Current Streak (across all habits)
  - Total Completions (for selected period)
- Daily Completion Trend: Recharts area chart showing daily completion count over time
- Habit Completion Heatmap: Full-year heatmap (like GitHub contributions) showing daily total completions
- Category Breakdown: Donut chart showing habits by category with completion rates
- Habit Leaderboard: Ranked table of habits sorted by completion rate, showing streak and total completions
- Weekly Pattern Analysis: Bar chart showing aggregate completions by day of week

### 6.6 Settings Page

**Sections:**

1. **Appearance**
   - Theme: Three-way toggle (Light / Dark / System)

2. **Preferences**
   - Week starts on: Toggle (Sunday / Monday)
   - Default view: Radio (Today / Week)
   - Show streaks on habit cards: Toggle
   - Show completion rate on habit cards: Toggle

3. **Data Management**
   - Export Data: Button. Exports all habits and completions as JSON file download.
   - Import Data: File upload. Accepts JSON file from export. Shows preview of data to import with confirmation.
   - Clear All Data: Destructive button with two-step confirmation ("This will permanently delete all habits and completion history. Type DELETE to confirm.")

4. **About**
   - App name, version
   - "Built with privacy in mind. All data is stored locally on your device."
   - Link to source (optional)

---

## 7. PWA Configuration

### 7.1 Web App Manifest

```json
{
  "name": "HabitFlow",
  "short_name": "HabitFlow",
  "description": "Track your daily habits with a beautiful, private habit tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 7.2 Service Worker Strategy

- Cache static assets (JS, CSS, fonts, icons) on install using Cache API
- Use network-first strategy for page navigations
- Use cache-first strategy for static assets
- Handle offline gracefully (app should be fully functional offline)
- Update service worker on new deployments (skip waiting + clients claim)
- Show "Update available" toast when new version is detected

### 7.3 PWA Meta Tags

Include in root layout `<head>`:
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `<link rel="apple-touch-icon" href="/icons/icon-192.png">`
- Viewport meta with `viewport-fit=cover` for safe areas
- Theme color meta tag (dynamic based on light/dark mode)

---

## 8. Responsive Design Breakpoints

```
Mobile: < 640px (sm)
  - Single column layout
  - Bottom navigation bar (fixed)
  - Full-width cards
  - Sheet/drawer for modals
  - Larger tap targets (min 44x44px)
  - Swipe gestures enabled

Tablet: 640px - 1024px (sm to lg)
  - Two-column grid for stat cards
  - Side navigation appears at lg (1024px)
  - Cards in 2-column grid

Desktop: > 1024px (lg+)
  - Sidebar navigation (fixed, 240px wide)
  - Main content area with max-width container
  - Multi-column grids (3-4 columns for stats)
  - Hover states on interactive elements
  - Keyboard shortcuts active
```

### 8.1 Navigation Pattern

**Mobile (< 1024px):**
- Fixed bottom navigation bar with 4 items: Today, Week, Stats, Settings
- Each item: icon + label, active state with accent color
- Habit management accessed via "+" FAB (floating action button) or from habit cards

**Desktop (>= 1024px):**
- Fixed left sidebar (240px)
- Navigation items: Dashboard (Today + Week as sub-items), Habits (management), Statistics, Settings
- User greeting at top of sidebar
- Sidebar has frosted glass effect matching design system

---

## 9. Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `N` | Create new habit |
| `T` | Switch to Today view |
| `W` | Switch to Week view |
| `S` | Switch to Stats view |
| `1-9` | Toggle completion for habit 1-9 in today's list |
| `?` | Show keyboard shortcuts help |
| `Cmd/Ctrl + K` | Quick search habits |
| `Left/Right` | Navigate weeks (in week view) |
| `Escape` | Close any open dialog/sheet |

---

## 10. Accessibility Requirements

- All interactive elements must have visible focus indicators (2px ring with accent color)
- Color is never the only means of conveying information (always pair with icons or text)
- All images and icons have appropriate alt text or aria-label
- Minimum contrast ratio of 4.5:1 for normal text, 3:1 for large text
- Screen reader announcements for state changes (habit completed, errors, navigation)
- Respect prefers-reduced-motion: disable all animations when set
- All forms have proper label associations
- Keyboard navigable: every feature accessible without a mouse
- Touch targets minimum 44x44px on mobile
- Skip navigation link for keyboard users
- ARIA live regions for dynamic content updates (streak changes, completion counts)

---

## 11. Performance Requirements

- Lighthouse Performance score: 95+
- Lighthouse Accessibility score: 100
- Lighthouse Best Practices score: 100
- Lighthouse PWA score: Pass all audits
- First Contentful Paint: < 1.0s
- Largest Contentful Paint: < 1.5s
- Total Blocking Time: < 100ms
- Cumulative Layout Shift: < 0.05
- Bundle size (gzipped): < 150KB initial JS
- IndexedDB operations: < 50ms for reads, < 100ms for writes
- Smooth 60fps animations

---

## 12. Data Export/Import Format

### 12.1 Export Schema

```json
{
  "version": "1.0",
  "exportedAt": "2026-02-15T10:30:00.000Z",
  "app": "HabitFlow",
  "data": {
    "habits": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string | null",
        "icon": "string",
        "color": "string",
        "frequency": "string",
        "targetDays": "number[] | null",
        "targetCount": "number | null",
        "reminderTime": "string | null",
        "category": "string | null",
        "sortOrder": "number",
        "isArchived": "boolean",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "completions": [
      {
        "id": "uuid",
        "habitId": "uuid",
        "date": "YYYY-MM-DD",
        "completedAt": "string",
        "note": "string | null"
      }
    ],
    "settings": {
      "theme": "string",
      "weekStartsOn": "number",
      "showStreaks": "boolean",
      "showCompletionRate": "boolean",
      "defaultView": "string"
    }
  }
}
```

---

## 13. AWS Deployment Architecture

### 13.1 S3 Configuration

- Bucket: Private (no public access)
- Static website hosting: Disabled (CloudFront handles routing)
- Bucket policy: Allow CloudFront OAC (Origin Access Control) read access only
- Enable versioning for rollback capability
- Lifecycle rule: Delete old versions after 30 days

### 13.2 CloudFront Configuration

- Origin: S3 bucket via OAC
- Default root object: `index.html`
- Custom error responses:
  - 403 -> `/index.html` (200) for client-side routing
  - 404 -> `/index.html` (200) for client-side routing
- Cache behaviors:
  - `/_next/static/*`: Cache 1 year (immutable hashed files)
  - `/icons/*`: Cache 1 year
  - `/manifest.json`: Cache 1 hour
  - `/sw.js`: Cache 0 (no-cache, no-store) - service worker must not be cached
  - Default (`*`): Cache 1 hour
- HTTPS only (redirect HTTP to HTTPS)
- Compress objects automatically (gzip + brotli)
- Price class: Use North America and Europe edge locations
- Optional: Custom domain with ACM certificate

### 13.3 Build and Deploy

```bash
# Build command
next build
# Output directory: out/

# Deploy command (AWS CLI)
aws s3 sync out/ s3://BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

---

## 14. Testing Strategy

### 14.1 Unit Tests (Vitest)

- All Zod schemas: Valid and invalid input cases
- All database service methods: CRUD operations with mock Dexie
- All custom hooks: State transitions, edge cases
- Date utility functions: Streak calculations, date ranges, boundary conditions
- Statistics computations: Completion rates, trends, averages

### 14.2 Component Tests (React Testing Library)

- Habit card: Renders correctly, toggle interaction, visual states
- Habit form: Validation, submission, error display
- Dashboard: Progress calculation, habit list rendering
- Week view: Grid rendering, navigation, cell interactions
- Settings: Theme toggle, data export/import flows

### 14.3 Test File Conventions

- Test files co-located with source: `component.test.tsx` next to `component.tsx`
- Shared test utilities in `test/utils.ts`
- Mock data factories in `test/factories.ts`
- Database mocks in `test/mocks/db.ts`

---

## 15. Project Structure

```
habitflow/
  public/
    icons/                     // PWA icons (192, 512, maskable)
    manifest.json              // Web app manifest
    sw.js                      // Service worker
  src/
    app/
      layout.tsx
      page.tsx
      habits/
        page.tsx
        new/page.tsx
        [id]/
          page.tsx
          edit/page.tsx
      stats/page.tsx
      settings/page.tsx
      globals.css              // Tailwind imports + CSS variables
    components/
      ui/                      // Primitive components
      layout/                  // App shell, nav, header
      habits/                  // Habit-specific components
      dashboard/               // Dashboard components
      stats/                   // Statistics components
      settings/                // Settings components
      shared/                  // Shared components
    db/
      database.ts              // Dexie instance and table definitions
      schemas.ts               // Zod validation schemas
      habit-service.ts         // Habit CRUD operations
      completion-service.ts    // Completion CRUD operations
      settings-service.ts      // Settings read/write
    hooks/
      use-habits.ts
      use-completions.ts
      use-habit-stats.ts
      use-settings.ts
      use-theme.ts
      use-today.ts
      use-date-range.ts
      use-media-query.ts
      use-keyboard-shortcut.ts
    lib/
      utils.ts                 // cn() helper, formatters, constants
      date-utils.ts            // date-fns wrappers for common operations
      stats-utils.ts           // Statistical calculation functions
      export-import.ts         // Data export/import logic
    types/
      index.ts                 // Shared TypeScript types
    test/
      utils.ts                 // Test utilities
      factories.ts             // Test data factories
      mocks/
        db.ts                  // Database mocks
  next.config.js               // output: 'export', image optimization off
  tailwind.config.ts           // Theme extension, custom colors
  tsconfig.json                // Strict mode
  vitest.config.ts             // Test configuration
  package.json
```

---

## 16. Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
1. Project scaffolding: Next.js, TypeScript, Tailwind, Vitest
2. Design system: UI primitives (Button, Card, Input, Dialog, etc.)
3. Database layer: Dexie setup, Zod schemas, service layer
4. App shell: Layout, navigation (responsive), theme support
5. PWA basics: Manifest, service worker, icons

### Phase 2: Core Features (Habit CRUD + Daily Tracking)
1. Create habit form with full validation
2. Edit and archive habits
3. Today view with completion toggles
4. Completion toggle animation and feedback
5. Habit list with sorting and filtering
6. Empty states

### Phase 3: Views and History
1. Week view with 7-day grid
2. Habit detail page with calendar heatmap
3. Streak calculation engine
4. Habit history and notes

### Phase 4: Statistics and Analytics
1. Statistics page with date range selector
2. Completion trend charts (Recharts)
3. Category breakdown visualization
4. Habit leaderboard
5. Weekly pattern analysis

### Phase 5: Polish and Deploy
1. Data export/import
2. Settings page (all preferences)
3. Keyboard shortcuts
4. Performance optimization (code splitting, lazy loading)
5. Accessibility audit and fixes
6. S3 + CloudFront deployment
7. Final testing pass

---

## 17. Edge Cases and Business Rules

### 17.1 Streak Calculation Rules

- A streak counts consecutive **scheduled** days where the habit was completed
- If a habit is not scheduled for a day (e.g., weekends-only habit on a Monday), that day does not break the streak
- The current streak includes today if today's habit is already completed
- If today's habit is not yet completed but it is still the current day, the streak from yesterday is shown as "current" (it has not been broken yet)
- A streak is broken when a scheduled day passes without completion
- Best streak is the longest streak ever recorded for that habit

### 17.2 Completion Rate Calculation

- Completion rate = (completions / scheduled days) * 100, for the selected time period
- Only count days where the habit was scheduled (respect frequency settings)
- Do not count future days
- Do not count days before the habit was created
- Round to nearest integer for display

### 17.3 Date Handling

- All dates stored as strings: YYYY-MM-DD for dates, ISO 8601 for timestamps
- "Today" is always the user's local date (not UTC)
- Day boundaries: A day starts at midnight local time
- Week boundaries respect the user's weekStartsOn setting
- Handle timezone changes gracefully (user traveling)

### 17.4 Habit Archiving vs. Deletion

- Archive: Habit is hidden from daily views but data is preserved. Completions remain. Can be restored.
- Delete: Permanent removal of habit and all associated completions. Requires confirmation.
- Archived habits do not count toward daily progress or statistics unless specifically viewing archived data.

### 17.5 Data Limits

- Maximum active habits: 50 (show warning at 40, hard limit at 50)
- Maximum habit name length: 100 characters
- Maximum description length: 500 characters
- Maximum note length: 250 characters
- Maximum data retention: Unlimited (user's device storage is the limit)

---

## 18. Error Handling

- Database errors: Show toast with "Something went wrong. Your data is safe." and log to console
- Form validation: Inline errors below each field, scroll to first error
- Import errors: Show detailed error message about what failed (invalid format, missing fields, etc.)
- Service worker errors: Graceful degradation, app works without SW
- Network errors: Not applicable (offline-first), but handle any CDN asset loading failures
- All errors should be non-blocking. The app should never show a blank screen or crash.
- Implement React Error Boundaries at the page level with a friendly fallback UI and "Try Again" button

---

## 19. Future Considerations (Out of Scope for v1.0)

These are explicitly NOT part of v1.0 but documented for future reference:

- Cloud sync / multi-device support
- User accounts and authentication
- Social features (sharing streaks, accountability partners)
- Habit templates / presets
- Push notifications / reminders (requires notification permission)
- Habit goals with milestones
- Mood/energy tracking alongside habits
- Widgets for mobile home screens
- Apple Watch / wearable companion
- Data analytics with AI insights
