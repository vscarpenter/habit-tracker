export const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "";

export function isSyncConfigured(): boolean {
  return Boolean(POCKETBASE_URL);
}

// PocketBase collection name constants
export const COLLECTIONS = {
  USERS: "users",
  SYNC_SNAPSHOTS: "habitflow_sync_snapshots",
  COMPLETIONS: "habitflow_completions",
} as const;
