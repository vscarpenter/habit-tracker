/**
 * Auth service — wraps PocketBase auth with HabitFlow-specific helpers.
 *
 * Supported sign-in method:
 *   1. Google OAuth
 */

import type { BaseAuthStore, RecordModel } from "pocketbase";
import { getPocketBaseClient } from "./pocketbase-client";
import type { SyncUser } from "./types";

function modelToSyncUser(model: RecordModel | null): SyncUser | null {
  if (!model) return null;
  return {
    id: model.id,
    email: typeof model.email === "string" ? model.email : "",
    createdAt: typeof model.created === "string" ? model.created : new Date().toISOString(),
  };
}

function authStoreUser(authStore: BaseAuthStore): SyncUser | null {
  if (!authStore.isValid) return null;
  return modelToSyncUser(authStore.record);
}

export const authService = {
  /**
   * Returns the currently authenticated user, or null if not signed in.
   */
  async getUser(): Promise<SyncUser | null> {
    const client = getPocketBaseClient();
    return authStoreUser(client.authStore);
  },

  /**
   * Signs in with Google OAuth.
   */
  async signInWithGoogle(): Promise<void> {
    const client = getPocketBaseClient();
    await client.collection("users").authWithOAuth2({ provider: "google" });
  },

  /**
   * Signs the current user out and clears the local auth store.
   */
  async signOut(): Promise<void> {
    const client = getPocketBaseClient();
    client.authStore.clear();
  },

  /**
   * Subscribes to auth state changes.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  onAuthChange(callback: (user: SyncUser | null) => void): () => void {
    const client = getPocketBaseClient();
    return client.authStore.onChange(() => {
      callback(authStoreUser(client.authStore));
    });
  },
};
