# HabitFlow

**Build better habits. Keep your data private.**

HabitFlow is a habit tracking app that respects your privacy. There are no accounts, no servers collecting your data, and no subscriptions. Everything lives on your device in the browser's IndexedDB storage. It works offline, it's fast, and it's yours.

The idea is simple: track the things you want to do every day, see your streaks build, and stay motivated by watching your progress over time. Whether it's reading, exercising, meditating, or drinking enough water — HabitFlow gives you a clean, distraction-free space to stay consistent.

**Live demo:** [habittracker.vinny.dev](https://habittracker.vinny.dev)

## Features

- **One-tap completions** — Mark habits done from today's dashboard with a single tap
- **Flexible scheduling** — Daily, weekdays, weekends, specific days, or X times per week
- **Streaks & stats** — Current streak, best streak, completion rates, and trend analysis
- **Week & month views** — See your consistency patterns at a glance
- **Analytics dashboard** — Completion heatmap, category breakdown, habit leaderboard
- **Dark mode** — Light, dark, or match your system preference
- **Offline-first PWA** — Install it to your home screen; works without internet
- **Export & import** — Back up your data as JSON anytime
- **Keyboard shortcuts** — Power-user navigation on desktop

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+) or Node.js 18+

### Setup

```bash
git clone https://github.com/vscarpenter/habit-tracker.git
cd habit-tracker
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and start tracking.

### Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the dev server |
| `bun run build` | Build static export to `out/` |
| `bun run test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Lint with ESLint |
| `bun run type-check` | TypeScript type checking |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Database | Dexie.js (IndexedDB) |
| Validation | Zod 4 |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |

## Architecture

HabitFlow is a fully static site — no API routes, no server-side rendering. The Next.js `output: 'export'` mode generates plain HTML/JS/CSS that can be hosted anywhere.

```
src/
  app/          Routes (today, habits, week, month, stats, settings)
  components/   UI primitives, layout, feature components
  db/           Dexie instance, Zod schemas, service modules
  hooks/        Domain logic (stats, completions, theme, keyboard)
  lib/          Pure utility functions (date math, stats algorithms)
  test/         Factories, mocks, test utilities
```

**Key design decisions:**

- **Service layer pattern** — All database access goes through `src/db/*-service.ts` modules. Components never touch IndexedDB directly.
- **Hooks own the logic** — React components render; custom hooks compute. This keeps components thin and logic testable.
- **Pure computation in `src/lib/`** — Stats algorithms, date utilities, and export/import logic are pure functions with no React or DB dependencies. Easy to unit test.

## Self-Hosting

HabitFlow builds to a static `out/` directory. You can host it on any static file server.

### Any static host

```bash
bun run build
# Upload the out/ directory to your host of choice
```

Works with Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any web server that can serve static files.

### AWS S3 + CloudFront

The included deploy script handles S3 sync, cache headers, and CloudFront invalidation:

```bash
# Set your AWS infrastructure details
export BUCKET_NAME="your-bucket"
export DIST_ID="your-cloudfront-distribution-id"
export DOMAIN_NAME="your-domain.com"

bun run deploy
```

Requires the [AWS CLI](https://aws.amazon.com/cli/) and [jq](https://jqlang.github.io/jq/). See `scripts/deploy.sh` for details.

**Note:** For client-side routing to work, configure your host to serve `index.html` for 404s (CloudFront custom error responses, Netlify `_redirects`, etc.).

## Running Tests

```bash
bun run test
```

The test suite covers utility functions, Zod schema validation, date calculations, statistics algorithms, export/import logic, and keyboard shortcut handling.

## License

MIT
