/**
 * PocketBase client singleton.
 *
 * Import `getPocketBaseClient` from this module everywhere in the sync layer.
 * The client is lazily created so the app can boot without sync configured.
 *
 * Required environment variable (add to .env.local):
 *   NEXT_PUBLIC_POCKETBASE_URL=https://api.vinny.io
 */

import PocketBase from "pocketbase";

function createPocketBaseClient(): PocketBase {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL;

  if (!url) {
    throw new Error(
      "PocketBase is not configured. Set NEXT_PUBLIC_POCKETBASE_URL in .env.local."
    );
  }

  return new PocketBase(url);
}

let _client: PocketBase | null = null;

/** Returns the shared PocketBase client, creating it on the first call. */
export function getPocketBaseClient(): PocketBase {
  if (!_client) _client = createPocketBaseClient();
  return _client;
}
