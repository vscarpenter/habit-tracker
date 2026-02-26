/**
 * Shared types for the sync subsystem.
 * Provider-agnostic — used by all sync service implementations.
 */

export type SyncStatus =
  | "idle"
  | "syncing"
  | "success"
  | "error"
  | "conflict";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  /** True if the last merge resolved differences between local and remote */
  hadConflict: boolean;
}

export interface SyncUser {
  /** Unique user identifier from the auth provider (e.g. Cognito sub, Supabase user.id) */
  userId: string;
  email: string;
}

export const INITIAL_SYNC_STATE: SyncState = {
  status: "idle",
  lastSyncedAt: null,
  error: null,
  hadConflict: false,
};
