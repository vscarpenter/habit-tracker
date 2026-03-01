import PocketBase, { ClientResponseError } from "pocketbase";

// ── Shared rules ─────────────────────────────────────────────────────────────

const OWNER_RULE = '@request.auth.id != "" && ownerId = @request.auth.id';
const CREATE_RULE = '@request.auth.id != "" && @request.body.ownerId = @request.auth.id';

// ── Collection configs ───────────────────────────────────────────────────────

const SNAPSHOTS_COLLECTION = "habitflow_sync_snapshots";
const COMPLETIONS_COLLECTION = "habitflow_completions";

type FieldConfig = Record<string, unknown> & {
  name: string;
  type: string;
};

interface CollectionConfig {
  name: string;
  fields: FieldConfig[];
  indexes: string[];
}

const snapshotsConfig: CollectionConfig = {
  name: SNAPSHOTS_COLLECTION,
  fields: [
    { name: "ownerId", type: "text", required: true, max: 0 },
    { name: "payload", type: "json", required: true, maxSize: 0 },
    { name: "exportedAt", type: "date", required: false },
  ],
  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_${SNAPSHOTS_COLLECTION}_ownerId ON ${SNAPSHOTS_COLLECTION} (ownerId)`,
  ],
};

const completionsConfig: CollectionConfig = {
  name: COMPLETIONS_COLLECTION,
  fields: [
    { name: "ownerId", type: "text", required: true, max: 0 },
    { name: "habitId", type: "text", required: true, max: 0 },
    { name: "date", type: "text", required: true, max: 0 },
    { name: "completedAt", type: "text", required: true, max: 0 },
    { name: "note", type: "text", required: false, max: 0 },
    { name: "localId", type: "text", required: true, max: 0 },
  ],
  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_${COMPLETIONS_COLLECTION}_owner_habit_date ON ${COMPLETIONS_COLLECTION} (ownerId, habitId, date)`,
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ClientResponseError && error.status === 404;
}

function upsertField(fields: FieldConfig[], desired: FieldConfig): FieldConfig[] {
  const idx = fields.findIndex((field) => field.name === desired.name);
  if (idx === -1) {
    return [...fields, desired];
  }

  const merged = { ...fields[idx], ...desired };
  const next = [...fields];
  next[idx] = merged;
  return next;
}

async function ensureCollection(pb: PocketBase, config: CollectionConfig): Promise<void> {
  try {
    const existing = await pb.collections.getOne(config.name);
    let nextFields = (existing.fields ?? []) as FieldConfig[];
    for (const field of config.fields) {
      nextFields = upsertField(nextFields, field);
    }

    const existingIndexes = Array.isArray(existing.indexes) ? existing.indexes : [];
    const nextIndexes = [...existingIndexes];
    for (const desired of config.indexes) {
      const alreadyExists = existingIndexes.some((idx) => {
        const desiredName = desired.match(/idx_\w+/)?.[0] ?? "";
        return desiredName && idx.includes(desiredName);
      });
      if (!alreadyExists) nextIndexes.push(desired);
    }

    await pb.collections.update(existing.id, {
      name: config.name,
      type: "base",
      fields: nextFields,
      indexes: nextIndexes,
      listRule: OWNER_RULE,
      viewRule: OWNER_RULE,
      createRule: CREATE_RULE,
      updateRule: OWNER_RULE,
      deleteRule: OWNER_RULE,
    });

    console.log(`Updated collection: ${config.name}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;

    await pb.collections.create({
      name: config.name,
      type: "base",
      fields: config.fields,
      indexes: config.indexes,
      listRule: OWNER_RULE,
      viewRule: OWNER_RULE,
      createRule: CREATE_RULE,
      updateRule: OWNER_RULE,
      deleteRule: OWNER_RULE,
    });

    console.log(`Created collection: ${config.name}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const baseUrl = process.env.POCKETBASE_URL ?? process.env.NEXT_PUBLIC_POCKETBASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Missing PocketBase URL. Set POCKETBASE_URL or NEXT_PUBLIC_POCKETBASE_URL."
    );
  }

  const adminEmail = requiredEnv("POCKETBASE_ADMIN_EMAIL");
  const adminPassword = requiredEnv("POCKETBASE_ADMIN_PASSWORD");

  const pb = new PocketBase(baseUrl);
  await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);

  try {
    await ensureCollection(pb, snapshotsConfig);
    await ensureCollection(pb, completionsConfig);
  } finally {
    pb.authStore.clear();
  }

  console.log("PocketBase HabitFlow sync collections are ready.");
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to set up PocketBase sync collections: ${message}`);
  process.exit(1);
});
