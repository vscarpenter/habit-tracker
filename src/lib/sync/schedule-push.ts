/**
 * Debounced push — call after every local DB write to schedule a cloud push.
 *
 * Safe to call unconditionally:
 *   - No-op when PocketBase env var is missing
 *   - No-op when the user is not authenticated
 *   - Silently catches all errors (push failures surface in useSyncService)
 *   - Debounced at 2 s so rapid-fire writes (bulk import, multiple toggles)
 *     coalesce into a single upload
 */

import { syncService } from "./sync-service";
import { authService } from "./auth-service";
import { logger } from "@/lib/logger";

const DEBOUNCE_MS = 2_000;

let timer: ReturnType<typeof setTimeout> | null = null;

export function schedulePush(): void {
  if (timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    timer = null;
    try {
      const user = await authService.getUser();
      if (!user) return;
      await syncService.push();
    } catch (err) {
      // Push failures are non-critical — the user can always "Sync now" manually
      logger.warn("[schedulePush] Background push failed", err);
    }
  }, DEBOUNCE_MS);
}
