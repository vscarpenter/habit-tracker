# Repository Guidelines

## Project Structure & Module Organization
Core code lives in `src/`:
- `src/app/`: Next.js App Router pages (`/`, `/habits`, `/week`, `/month`, `/stats`, `/settings`).
- `src/components/`: UI and feature components (`dashboard`, `habits`, `stats`, `layout`, `shared`, `ui`, `sync`).
- `src/hooks/`: reusable domain hooks (`use-habits`, `use-completions`, `use-sync`, etc.).
- `src/db/`: Dexie database, Zod schemas, and service-layer modules (`*-service.ts`).
- `src/lib/`: pure utilities and sync logic.
- `src/test/`: shared test setup and factories.

Other important folders: `public/` (PWA/static assets), `scripts/` (deploy/setup utilities), `docs/` (design and sync notes).

## Build, Test, and Development Commands
- `bun install`: install dependencies.
- `bun run dev`: start local dev server at `http://localhost:3000`.
- `bun run build`: production build and static export (`out/`).
- `bun run start`: run production server build.
- `bun run lint`: run ESLint (Next.js + TypeScript rules).
- `bun run type-check`: strict TypeScript checks with no emit.
- `bun run test`: run unit/integration tests once (Vitest).
- `bun run test:watch`: run tests in watch mode.
- `bun run setup:pocketbase-sync`: provision PocketBase sync collection/rules.
- `bun run deploy:dry-run`: validate deploy script behavior without applying changes.

## Coding Style & Naming Conventions
Use TypeScript with strict mode and existing project patterns:
- 2-space indentation, semicolons, double quotes.
- File names in kebab-case (example: `habit-form.tsx`, `use-keyboard-shortcuts.ts`).
- React components and interfaces in PascalCase; variables/functions in camelCase; constants in UPPER_SNAKE_CASE.
- Use `@/` import alias for `src/*`.
- Keep data access inside `src/db/*-service.ts`; components should call hooks/services, not IndexedDB directly.

## Testing Guidelines
- Framework: Vitest + Testing Library (`jsdom`), setup in `src/test/setup.ts`.
- Test files should be `src/**/*.test.ts` or `src/**/*.test.tsx`, usually colocated with the module.
- Prefer behavior-focused `describe`/`it` cases covering happy path and validation/error cases.
- No enforced coverage gate currently; add tests for all touched logic, especially `src/lib/`, `src/db/`, and sync flows.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (observed in history): `feat(scope): ...`, `fix(scope): ...`, `docs: ...`, `refactor: ...`.
- Keep commits focused and scoped (`sync`, `deploy`, `branding`, etc.).
- PRs should include: concise summary, linked issue (for example `#12`), test commands run, and screenshots/GIFs for UI changes.
- Avoid bundling unrelated refactors with feature/fix work.

## Security & Configuration Tips
- Copy from `.env.example`; keep local values in `.env.local`.
- Never commit secrets, tokens, or production credentials.
- Verify required env vars before running sync/deploy scripts.
