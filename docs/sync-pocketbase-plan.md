# PocketBase Sync Implementation Plan

**Status:** Implemented
**Date:** 2026-02-28

## Architecture

- Provider: PocketBase (`NEXT_PUBLIC_POCKETBASE_URL`)
- Auth: shared `users` auth collection via Google OAuth
- Sync storage collection: `habitflow_sync_snapshots`
- Payload strategy: full snapshot (`ExportData`) merge, then push

## PocketBase Collection

Collection name: `habitflow_sync_snapshots`

Fields:
- `ownerId` (`text`, required, unique)
- `payload` (`json`, required)
- `exportedAt` (`date`, optional)

Rules:
- `listRule`: `@request.auth.id != "" && ownerId = @request.auth.id`
- `viewRule`: `@request.auth.id != "" && ownerId = @request.auth.id`
- `createRule`: `@request.auth.id != "" && @request.body.ownerId = @request.auth.id`
- `updateRule`: `@request.auth.id != "" && ownerId = @request.auth.id`
- `deleteRule`: `@request.auth.id != "" && ownerId = @request.auth.id`

## Code Paths

- Client: `src/lib/sync/pocketbase-client.ts`
- Auth: `src/lib/sync/auth-service.ts`
- Sync service: `src/lib/sync/sync-service.ts`
- Merge logic: `src/lib/sync/merge.ts` (unchanged)
- Triggering background push: `src/lib/sync/schedule-push.ts` (unchanged behavior)
- UI/hook: `src/hooks/use-sync.ts`, `src/components/sync/*`

## Notes

- No Supabase backfill is performed.
- First PocketBase sync uploads current local IndexedDB state as the remote baseline.
- Shared PocketBase `users` auth across apps is safe because HabitFlow uses its own data collection.
