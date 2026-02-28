/**
 * Sync module — provider-agnostic types.
 *
 * These types are shared by the PocketBase implementation and any future
 * sync provider.  Import from here, not from the provider-specific module.
 */

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface SyncUser {
  /** Auth user id — used as the remote snapshot owner key. */
  id: string;
  email: string;
  /** ISO 8601 — when the account was created in the auth provider. */
  createdAt: string;
}

// ── Status ───────────────────────────────────────────────────────────────────

/**
 * Lifecycle of a single sync operation.
 *
 * idle       → nothing happening
 * syncing    → network I/O in progress
 * success    → last sync completed without errors
 * error      → last sync failed; inspect `errorMessage`
 * conflict   → merge produced changes that need user attention (future)
 */
export type SyncStatus = "idle" | "syncing" | "success" | "error" | "conflict";

export interface SyncState {
  status: SyncStatus;
  /** ISO 8601 timestamp of the last successful sync, or null if never. */
  lastSyncedAt: string | null;
  /** Human-readable error message when status === "error". */
  errorMessage: string | null;
  /** Whether the user is currently authenticated with the sync provider. */
  isAuthenticated: boolean;
  /** The authenticated user, or null when signed out. */
  user: SyncUser | null;
}

// ── Merge result ─────────────────────────────────────────────────────────────

export interface MergeResult {
  /** True when the merged snapshot differs from the local snapshot. */
  hasChanges: boolean;
  /** Stats about what changed — useful for logging / user feedback. */
  stats: {
    habitsUpdated: number;
    completionsAdded: number;
    settingsUpdated: boolean;
  };
}
