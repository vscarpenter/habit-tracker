# HabitFlow Sync Design

**Status:** Proposed
**Issue:** #4
**Date:** 2026-02-26

---

## Problem Statement

HabitFlow stores all data locally in IndexedDB. Users who access the app from multiple browsers or devices start with separate, isolated datasets. This document evaluates three options for adding optional cross-device sync while preserving the app's privacy-first principle.

---

## Data Model Summary

Three IndexedDB tables, all using UUIDs as primary keys and ISO 8601 timestamps:

| Table | Key Fields | Notes |
|---|---|---|
| `habits` | `id`, `updatedAt` | Soft-delete via `isArchived` |
| `completions` | `id`, `habitId`, `date`, `completedAt` | Append-only in practice |
| `settings` | `id`, `updatedAt` | Single row |

**Good news for sync:** The data model is well-suited for sync from day one:
- UUIDs eliminate ID collisions across devices
- `updatedAt` timestamps on habits and settings enable last-write-wins conflict resolution
- `completedAt` on completions enables per-record resolution
- The existing `ExportData` type in `src/lib/export-import.ts` is already the right shape for a sync payload

---

## Conflict Resolution Strategy (Shared Across All Options)

Any sync implementation must handle the case where the same data was modified on two devices offline. The merge strategy for each entity:

### Habits — Last Write Wins
```typescript
// Keep whichever version has the later updatedAt
const merged = localHabit.updatedAt > remoteHabit.updatedAt
  ? localHabit
  : remoteHabit;
```

### Completions — Union Merge
Completions are facts ("I completed this habit on this day"). The safest strategy is to take the union of both sets. For the same `(habitId, date)` pair, keep the one with the later `completedAt`.

```typescript
// Union: keep all completions from both sides
// For same (habitId, date), keep latest completedAt
```

### Settings — Last Write Wins
```typescript
const merged = localSettings.updatedAt > remoteSettings.updatedAt
  ? localSettings
  : remoteSettings;
```

### Hard Deletes
Hard deletes (currently in `habitService.delete()`) do not propagate over snapshot sync — device B will "resurrect" a habit that device A deleted. Two mitigations:

1. **Recommend Archive over Delete** for sync users (data is preserved, hidden from view)
2. **Tombstone records** (advanced): store `{ id, deletedAt }` records; during merge, suppress records with a matching tombstone

For initial implementation, option 1 (archive-first) is sufficient.

---

## Option A: AWS Cognito + S3 Snapshot Sync ⭐ Recommended

### Overview
Users authenticate via Amazon Cognito User Pools. Each authenticated user gets a private path in S3 (`users/{userId}/data.json`). The browser reads/writes directly to S3 using temporary credentials from a Cognito Identity Pool — **no custom API or Lambda required**.

### Architecture
```
Browser (IndexedDB)
    ↕  merge on load / push on write (debounced)
Amazon S3  (users/{cognitoSub}/data.json)
    ↑  temporary AWS credentials
Amazon Cognito Identity Pool
    ↑  JWT
Amazon Cognito User Pool  ←  user signs in
```

### Why This Fits HabitFlow
- Already deployed on AWS (S3 + CloudFront) — adds Cognito to the same account
- No custom backend code — Cognito Identity Pool grants the browser direct S3 access
- User data stays in **your** AWS account, under your S3 bucket policies
- Cost: Cognito MAU pricing (~$0.0055/MAU after 50k free), S3 negligible for JSON files
- Leverages the existing `ExportData` format as the sync payload

### Setup Steps

#### 1. AWS Infrastructure (one-time)

```bash
# Create Cognito User Pool
aws cognito-idp create-user-pool \
  --pool-name HabitFlowUsers \
  --auto-verified-attributes email \
  --username-attributes email

# Create User Pool Client (for browser/SPA)
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name HabitFlowWebApp \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --no-generate-secret  # required for browser clients

# Create Identity Pool
aws cognito-identity create-identity-pool \
  --identity-pool-name HabitFlowIdentities \
  --allow-unauthenticated-identities false \
  --cognito-identity-providers \
    ProviderName=cognito-idp.<REGION>.amazonaws.com/<USER_POOL_ID>,ClientId=<APP_CLIENT_ID>

# Attach IAM role to Identity Pool that allows s3:GetObject and s3:PutObject
# scoped to: arn:aws:s3:::your-bucket/users/${cognito-identity.amazonaws.com:sub}/*
```

**S3 bucket policy / IAM policy for the authenticated role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::YOUR_BUCKET/users/${cognito-identity.amazonaws.com:sub}/*"
  }]
}
```

#### 2. Frontend Dependencies

```bash
bun add @aws-amplify/auth @aws-amplify/storage
```

Or use the bare AWS SDK:
```bash
bun add @aws-sdk/client-s3 @aws-sdk/credential-providers
```

#### 3. Sync Service Sketch

```typescript
// src/lib/sync/s3-sync-service.ts

import { buildExportPayload, applyImport, validateImportData } from '@/lib/export-import';
import type { ExportData } from '@/lib/export-import';
import { mergeSnapshots } from './merge';

export interface SyncUser {
  userId: string;   // Cognito sub
  email: string;
  accessToken: string;
}

export const s3SyncService = {
  async pull(user: SyncUser): Promise<ExportData | null> {
    // GET s3://bucket/users/{userId}/data.json using temp credentials
    // Return null if no remote data yet
  },

  async push(user: SyncUser, data: ExportData): Promise<void> {
    // PUT data to s3://bucket/users/{userId}/data.json
  },

  /** Full sync: pull remote, merge with local, push merged, apply to IndexedDB */
  async sync(user: SyncUser): Promise<void> {
    const [remote, local] = await Promise.all([
      this.pull(user),
      buildExportPayload(),
    ]);

    if (!remote) {
      // First sync: just push local data
      await this.push(user, local);
      return;
    }

    const merged = mergeSnapshots(local, remote);
    await this.push(user, merged);
    await applyImport(merged);
  },
};
```

#### 4. Sync Triggers

- **On app load:** `sync()` if user is signed in (non-blocking, show spinner)
- **On data write:** debounced `push()` after 2 seconds of inactivity
- **Manual:** "Sync now" button in settings

### Trade-offs

| | |
|---|---|
| ✅ No custom API code | ✅ Data stays in your AWS account |
| ✅ Reuses existing infrastructure | ✅ Scales to any number of users |
| ⚠️ Requires Cognito setup | ⚠️ Snapshot sync (not real-time) |
| ⚠️ Hard deletes don't propagate | ⚠️ AWS SDK adds ~80kB to bundle |

---

## Option B: Google Drive App Folder Sync

### Overview
Users sign in with their Google account. The app stores `data.json` in their Google Drive **App Folder** — a hidden, app-specific folder that only this app can read. No custom backend, no AWS changes.

### Architecture
```
Browser (IndexedDB)
    ↕  merge on load / push on write
Google Drive App Folder (appDataFolder/data.json)
    ↑  OAuth 2.0 access token (drive.appdata scope)
Google OAuth 2.0  ←  user signs in with Google
```

### Why Consider This
- **No infrastructure changes** — purely client-side OAuth + Google Drive REST API
- Users already trust Google; friction-free sign-in
- Data lives in the user's own Google Drive account
- Free (App Folder storage counts against user's Google Drive quota)

### Setup Steps

1. Create a project in Google Cloud Console
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials (Web Application type)
4. Request scope: `https://www.googleapis.com/auth/drive.appdata`

```typescript
// src/lib/sync/gdrive-sync-service.ts

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const FILE_NAME = 'habitflow-data.json';

export const gdriveSyncService = {
  async getFileId(accessToken: string): Promise<string | null> {
    const res = await fetch(
      `${DRIVE_API}/files?spaces=appDataFolder&q=name='${FILE_NAME}'`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const json = await res.json();
    return json.files?.[0]?.id ?? null;
  },

  async pull(accessToken: string): Promise<ExportData | null> {
    const fileId = await this.getFileId(accessToken);
    if (!fileId) return null;

    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.json();
  },

  async push(accessToken: string, data: ExportData): Promise<void> {
    const fileId = await this.getFileId(accessToken);
    const body = JSON.stringify(data);
    const metadata = { name: FILE_NAME, parents: ['appDataFolder'] };

    if (fileId) {
      // Update existing
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body,
      });
    } else {
      // Create new
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([body], { type: 'application/json' }));
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
    }
  },
};
```

### Trade-offs

| | |
|---|---|
| ✅ Zero infrastructure changes | ✅ Data stays in user's Google account |
| ✅ No AWS costs | ✅ Easy OAuth via Google |
| ⚠️ Google dependency | ⚠️ Token refresh complexity |
| ⚠️ Some users avoid Google sign-in | ⚠️ No enterprise/self-hosted option |

---

## Option C: Supabase (Easiest Developer Experience)

### Overview
Supabase is an open-source Firebase alternative with Postgres, Auth, and Storage built in. Auth supports email/password, magic links, and OAuth providers (Google, GitHub, etc.). Data sync can be snapshot-based (Supabase Storage) or per-record (Supabase Postgres with row-level security).

### Architecture (Storage variant — same pattern as above)
```
Browser (IndexedDB)
    ↕  merge on load / push on write
Supabase Storage  (bucket: user-data/{userId}/data.json)
    ↑  JWT
Supabase Auth  ←  user signs in
```

### Architecture (Postgres variant — real-time sync)
```
Browser (IndexedDB)
    ↕  real-time subscription + REST upserts
Supabase Postgres  (tables: habits, completions, settings)
    Row-Level Security: user can only see their own rows
Supabase Auth  ←  user signs in
```

### Why Consider This
- **Fastest to production** — Supabase has a generous free tier, hosted infra
- Supabase SDK is excellent for Next.js
- Real-time sync is possible with Postgres subscriptions
- Can self-host later (open source)
- Rich auth options (magic links, OAuth, SSO)

### Quick Start

```bash
bun add @supabase/supabase-js
```

```typescript
// src/lib/sync/supabase-sync-service.ts
import { createClient } from '@supabase/supabase-js';
import { buildExportPayload, applyImport } from '@/lib/export-import';
import { mergeSnapshots } from './merge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseSyncService = {
  async signIn(email: string) {
    return supabase.auth.signInWithOtp({ email }); // magic link
  },

  async pull(userId: string): Promise<ExportData | null> {
    const { data } = await supabase.storage
      .from('user-data')
      .download(`${userId}/data.json`);
    if (!data) return null;
    return JSON.parse(await data.text());
  },

  async push(userId: string, exportData: ExportData): Promise<void> {
    await supabase.storage
      .from('user-data')
      .upload(`${userId}/data.json`, JSON.stringify(exportData), {
        contentType: 'application/json',
        upsert: true,
      });
  },

  async sync(userId: string): Promise<void> {
    const [remote, local] = await Promise.all([
      this.pull(userId),
      buildExportPayload(),
    ]);

    if (!remote) {
      await this.push(userId, local);
      return;
    }

    const merged = mergeSnapshots(local, remote);
    await this.push(userId, merged);
    await applyImport(merged);
  },
};
```

### Trade-offs

| | |
|---|---|
| ✅ Fastest to set up (hosted, free tier) | ✅ Many auth options |
| ✅ Real-time possible | ✅ Open source / self-hostable |
| ⚠️ Third-party data processor | ⚠️ Another vendor dependency |
| ⚠️ Free tier limits | ⚠️ Not AWS-native |

---

## Comparison Matrix

| Criterion | A: Cognito + S3 | B: Google Drive | C: Supabase |
|---|---|---|---|
| **Backend infrastructure** | AWS (already used) | None | Supabase (hosted) |
| **Auth providers** | Email, social via Cognito | Google only | Email, OAuth, magic link |
| **Data location** | Your AWS S3 | User's Google Drive | Supabase cloud |
| **Conflict resolution** | Snapshot merge | Snapshot merge | Snapshot or per-record |
| **Real-time sync** | No (snapshot) | No (snapshot) | Yes (Postgres) |
| **Offline support** | Full (sync on reconnect) | Full | Full |
| **Setup complexity** | Medium | Low-Medium | Low |
| **Ongoing cost** | Very low | Free | Free tier / paid |
| **Privacy posture** | Best (your infra) | Good (user's Google) | Good (open source) |
| **Hard delete propagation** | No (use archive) | No (use archive) | Yes (Postgres) |

---

## Recommended Implementation Plan

**Recommendation: Option A (AWS Cognito + S3)** for production, because it keeps all user data within the existing AWS account and requires no additional vendors. **Option C (Supabase)** is the fastest path to a working prototype.

### Phase 1: Foundation (all options share this)
1. Add `src/lib/sync/types.ts` — `SyncStatus`, `SyncUser`, `SyncState`
2. Add `src/lib/sync/merge.ts` — `mergeSnapshots()` function
3. Update `UserSettings` schema to add `syncEnabled: boolean` and `lastSyncedAt?: string`

### Phase 2: Authentication UI
1. Sign In / Sign Up page or modal (`/sync` route or settings panel)
2. Auth state hook (`use-auth.ts`)
3. Sync status indicator in the app shell

### Phase 3: Sync Service
1. Implement chosen provider service
2. Add `use-sync.ts` hook that triggers sync on load and after writes
3. Debounced push (2 second delay after last write)

### Phase 4: Settings Integration
1. "Sync" section in Settings — enable/disable, sign out, last synced time
2. "Sync now" manual trigger
3. Conflict indicator if merge detected changes

---

## Merge Utility (Shared Code)

The core merge logic is provider-agnostic. See `src/lib/sync/merge.ts` for the implementation.

Key behaviors:
- **Habits:** last-write-wins per record (by `updatedAt`)
- **Completions:** union merge; same `(habitId, date)` → keep latest by `completedAt`
- **Settings:** last-write-wins (by `updatedAt`)
- **Hard deletes:** not propagated — recommend archive over delete for sync users

---

## Security Considerations

1. **Tokens:** Never store access tokens in `localStorage`; use in-memory or `sessionStorage` only. Cognito Amplify handles this. Supabase uses httpOnly cookies in SSR mode.
2. **Data isolation:** S3 IAM policies and Supabase RLS must enforce that users can only access their own data paths.
3. **Validation:** Always run `validateImportData()` on data pulled from remote before applying to IndexedDB — same protection as the import flow.
4. **HTTPS only:** All sync traffic must be over HTTPS (CloudFront already enforces this).
5. **Payload size:** Enforce the existing 10 MB import size limit on sync payloads as well.
