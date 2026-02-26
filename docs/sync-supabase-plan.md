# Supabase Sync — Comprehensive Implementation Plan

> **Decision:** Option C — Supabase (Auth + Storage)
> **Approach:** Snapshot sync (full `ExportData` JSON per user), not row-level
> **Auth methods:** Email magic link (primary) + Google OAuth (secondary)

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  IndexedDB (Dexie)   ←→   Sync Service   ←→   Supabase     │
│  habits / completions      pull / push         Storage      │
│  / settings                merge               (JSON blob)  │
│                                                             │
│  useSyncService hook  ──→  auth-service   ←→   Supabase     │
│  (React state)             signIn/signOut       Auth        │
└────────────────────────────────────────────────────────────┘
```

**Storage layout (bucket: `habit-data`):**
```
habit-data/
  {supabase-user-id}/
    data.json   ← full ExportData snapshot
```

**Why snapshot sync instead of row-level?**
The existing `buildExportPayload()` / `applyImport()` functions already handle the full data lifecycle. Snapshot sync reuses this path entirely, making the sync layer thin. Row-level sync would require a Supabase Postgres table, real-time subscriptions, and more complex RLS — overkill for a personal habit tracker.

---

## What's Already Done (in this branch)

| File | Status |
|---|---|
| `src/lib/sync/types.ts` | ✅ Created — `SyncStatus`, `SyncState`, `SyncUser`, `MergeResult` |
| `src/lib/sync/merge.ts` | ✅ Created — `mergeSnapshots()` implementation |
| `src/lib/sync/merge.test.ts` | ✅ Created — full test coverage |
| `src/lib/sync/supabase-client.ts` | ✅ Created — Supabase client singleton |
| `src/lib/sync/auth-service.ts` | ✅ Created — magic link + Google OAuth |
| `src/lib/sync/sync-service.ts` | ✅ Created — pull / push / sync operations |
| `src/hooks/use-sync.ts` | ✅ Created — React hook with state management |
| `src/components/sync/sync-auth-modal.tsx` | ✅ Created — sign-in UI |
| `src/components/sync/sync-section.tsx` | ✅ Created — settings panel UI |

**Remaining work is integration and infrastructure** — nothing new to design.

---

## Implementation Phases

### Phase 1 — Supabase Project Setup (Infrastructure, ~1 day)

#### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name: `habitflow-sync`, region: closest to your CloudFront origin
3. Note your **Project URL** and **Anon public key** (Settings → API)

#### 1.2 Create Storage Bucket

In Supabase Dashboard → Storage → **New bucket**:

```
Name:    habit-data
Public:  NO  (private — enforced by RLS)
```

#### 1.3 Apply Row Level Security Policies

Run the following in Supabase SQL editor (Dashboard → SQL Editor):

```sql
-- Enable RLS on the storage.objects table (already on by default)

-- Policy: users can SELECT (download) only their own folder
CREATE POLICY "Users can read own data"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'habit-data' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: users can INSERT/UPDATE (upload) only their own folder
CREATE POLICY "Users can write own data"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'habit-data' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own data"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'habit-data' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: users can DELETE only their own folder (for future "Delete my data" feature)
CREATE POLICY "Users can delete own data"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'habit-data' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### 1.4 Configure Auth Providers

**Email (magic link) — enabled by default.** Customize the email template:
- Dashboard → Authentication → Email Templates → Magic Link
- Update `{{ .SiteURL }}` to your CloudFront domain

**Google OAuth (optional):**
1. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
2. Add authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`
3. Dashboard → Authentication → Providers → Google → enable + paste credentials

**Site URL** (important for magic link redirects):
- Dashboard → Authentication → URL Configuration
- Site URL: `https://your-cloudfront-domain.com`
- Redirect URLs: add `https://your-cloudfront-domain.com/**`

#### 1.5 Add Environment Variables

Create `.env.local` (never commit this file):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For production (CloudFront/S3 static site), set these at **build time** in your CI/CD pipeline. Since Next.js bakes `NEXT_PUBLIC_*` vars into the static bundle, they must be present during `bun run build`.

**GitHub Actions example:**
```yaml
- name: Build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  run: bun run build
```

Add the secrets in GitHub → Repository Settings → Secrets.

---

### Phase 2 — Install Dependency (~15 min)

```bash
bun add @supabase/supabase-js
```

The Supabase JS client is the only new dependency. No SSR helpers needed — the app is a static export with no server-side rendering.

---

### Phase 3 — Schema Updates (~1 hour)

The existing `UserSettings` type and Zod schema need two optional sync fields so the settings service can track sync preferences.

**`src/types/index.ts` — add to `UserSettings` interface:**

```typescript
export interface UserSettings {
  // ... existing fields ...
  syncEnabled: boolean;          // Whether the user has opted in to sync
  lastSyncedAt?: string;         // ISO 8601 — timestamp of last successful sync
}
```

**`src/db/schemas.ts` — add to `userSettingsSchema`:**

```typescript
export const userSettingsSchema = z.object({
  // ... existing fields ...
  syncEnabled: z.boolean().default(false),
  lastSyncedAt: z.iso.datetime().optional(),
});
```

**`src/db/settings-service.ts` — add to `DEFAULT_SETTINGS`:**

```typescript
const DEFAULT_SETTINGS: UserSettings = {
  // ... existing fields ...
  syncEnabled: false,
};
```

> **Note:** Dexie handles adding new optional fields to existing records transparently — no migration needed for IndexedDB schema version.

---

### Phase 4 — Wire Up UI Integration (~2–3 hours)

#### 4.1 Add Sync Section to Settings Page

Edit `src/components/settings/settings-content.tsx` to import and render `SyncSection`:

```typescript
import { SyncSection } from "@/components/sync/sync-section";
import { useSyncService } from "@/hooks/use-sync";

// Inside SettingsContent component:
const { syncState, isSyncConfigured, signInWithMagicLink, signInWithGoogle, signOut, syncNow } =
  useSyncService();

// Add a new Card:
<Card title="Sync">
  <SyncSection
    syncState={syncState}
    isSyncConfigured={isSyncConfigured}
    onMagicLink={signInWithMagicLink}
    onGoogle={signInWithGoogle}
    onSignOut={signOut}
    onSyncNow={syncNow}
  />
</Card>
```

#### 4.2 Auto-sync on App Load

The `useSyncService` hook already pulls from remote on mount when the user is authenticated. No additional wiring needed for the initial pull.

#### 4.3 Debounced Push After Writes (optional but recommended)

Add a debounced push call in each service module after successful DB writes. This ensures changes made locally propagate to the cloud without requiring a manual "Sync now":

```typescript
// src/db/habit-service.ts (example — replicate for completion-service, settings-service)
import { syncService } from "@/lib/sync/sync-service";
import { authService } from "@/lib/sync/auth-service";

// Simple debounce — share this instance across service calls
let pushTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const user = await authService.getUser();
    if (user) await syncService.push().catch(() => {}); // Errors surface in useSyncService
  }, 2000);
}

// Call schedulePush() at the end of create(), update(), delete(), etc.
```

#### 4.4 Sync Status Indicator in NavBar (optional)

Add a subtle cloud icon with sync status to `src/components/layout/nav-bar.tsx` for at-a-glance feedback. This requires passing `syncState` down or using a context. A simple approach using a context:

```typescript
// src/contexts/sync-context.tsx
"use client";
import { createContext, useContext } from "react";
import { useSyncService } from "@/hooks/use-sync";
// ... standard context boilerplate
```

---

### Phase 5 — Testing (~1–2 days)

#### 5.1 Run Existing Merge Tests

The merge utility has full test coverage already:

```bash
bunx vitest run src/lib/sync/merge.test.ts
```

#### 5.2 Auth Service Tests (with Supabase mocked)

Create `src/lib/sync/auth-service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client
vi.mock("@/lib/sync/supabase-client", () => ({
  getSupabaseClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  })),
}));

import { authService } from "./auth-service";

describe("authService", () => {
  it("returns null when no session exists", async () => {
    expect(await authService.getUser()).toBeNull();
  });

  it("calls signInWithOtp with the provided email", async () => {
    await authService.signInWithMagicLink("test@example.com");
    // assert mock was called
  });
});
```

#### 5.3 Sync Service Tests (with Supabase + DB mocked)

Create `src/lib/sync/sync-service.test.ts` following the same mocking pattern.

#### 5.4 useSyncService Hook Tests

Use `renderHook` from React Testing Library with mocked `authService` and `syncService`.

---

### Phase 6 — Offline Handling (~half a day)

The app is already offline-capable (PWA with service worker). Add graceful degradation:

1. **Detect offline status** — use `navigator.onLine` + `window.addEventListener('online', ...)`
2. **Skip push when offline** — wrap `syncService.push()` calls with an online check
3. **Queue and retry on reconnect** — listen for the `online` event and call `syncNow()`

```typescript
// In useSyncService:
useEffect(() => {
  function handleOnline() {
    if (syncState.isAuthenticated) performSync();
  }
  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}, [syncState.isAuthenticated, performSync]);
```

---

### Phase 7 — "Delete My Data" Feature (~half a day)

Allow users to delete their cloud data from the Settings page:

```typescript
// In sync-service.ts:
async deleteRemoteData(): Promise<void> {
  const user = await authService.getUser();
  if (!user) return;
  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .remove([remotePath(user.id)]);
  if (error) throw error;
}
```

Wire up a "Delete cloud data" button in `SyncSection` with a confirmation dialog.

---

## File Map — Everything That Changes

| File | Action | Phase |
|---|---|---|
| `bun.lock` / `package.json` | Install `@supabase/supabase-js` | 2 |
| `.env.local` (gitignored) | Add Supabase env vars | 1 |
| `src/types/index.ts` | Add `syncEnabled`, `lastSyncedAt` to `UserSettings` | 3 |
| `src/db/schemas.ts` | Add Zod fields to `userSettingsSchema` | 3 |
| `src/db/settings-service.ts` | Add defaults for new fields | 3 |
| `src/db/habit-service.ts` | Add `schedulePush()` calls after writes | 4 |
| `src/db/completion-service.ts` | Add `schedulePush()` calls after writes | 4 |
| `src/db/settings-service.ts` | Add `schedulePush()` calls after writes | 4 |
| `src/lib/sync/types.ts` | ✅ Done | — |
| `src/lib/sync/merge.ts` | ✅ Done | — |
| `src/lib/sync/merge.test.ts` | ✅ Done | — |
| `src/lib/sync/supabase-client.ts` | ✅ Done | — |
| `src/lib/sync/auth-service.ts` | ✅ Done | — |
| `src/lib/sync/sync-service.ts` | ✅ Done | — |
| `src/lib/sync/auth-service.test.ts` | Create | 5 |
| `src/lib/sync/sync-service.test.ts` | Create | 5 |
| `src/hooks/use-sync.ts` | ✅ Done | — |
| `src/components/sync/sync-auth-modal.tsx` | ✅ Done | — |
| `src/components/sync/sync-section.tsx` | ✅ Done | — |
| `src/components/settings/settings-content.tsx` | Wire up `SyncSection` | 4 |

---

## Conflict Resolution Reference

| Entity | Strategy | Key field |
|---|---|---|
| `Habit` | Last-write-wins per record | `updatedAt` |
| `HabitCompletion` | Union merge; duplicate `(habitId, date)` → keep latest | `completedAt` |
| `UserSettings` | Last-write-wins | `updatedAt` |
| Hard deletes | **Not propagated** — use archive (`isArchived: true`) | — |

---

## Privacy & Security Notes

- The Supabase **anon key** is safe to expose in the browser — it's not a secret.
  Access is gated entirely by Row Level Security (RLS) policies, not by key secrecy.
- Each user's data lives in an isolated storage path (`{userId}/data.json`).
- Data is encrypted in transit (HTTPS) and at rest by Supabase.
- No habit data is ever sent to or read by Supabase — only the authenticated user's own JSON.
- Users can opt out at any time via "Sign out" (local data remains intact).
- GDPR: users can request deletion via "Delete cloud data" feature (Phase 7).

---

## Supabase Free Tier Limits

| Resource | Free tier limit | Expected usage |
|---|---|---|
| Storage | 1 GB | ~50 KB per user → 20,000 users |
| Auth MAUs | 50,000 | — |
| Bandwidth | 5 GB / month | ~50 KB × syncs per user |
| API requests | 500,000 / month | Low (snapshot, not real-time) |

For a personal app this will never reach the free tier limits.

---

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Create `habit-data` storage bucket (private)
- [ ] Apply RLS SQL policies
- [ ] Configure email magic link template (update site URL)
- [ ] Optionally configure Google OAuth provider
- [ ] Run `bun add @supabase/supabase-js`
- [ ] Create `.env.local` with Supabase URL and anon key
- [ ] Add `syncEnabled` / `lastSyncedAt` to `UserSettings` type + schema + defaults
- [ ] Wire `SyncSection` into `settings-content.tsx`
- [ ] Add `schedulePush()` calls to service modules after writes
- [ ] Add GitHub secrets for CI/CD build
- [ ] Run `bunx vitest run src/lib/sync/` to verify tests pass
- [ ] Test: sign in on Device A, add habits, sync; sign in on Device B, verify habits appear
