import PocketBase, { ClientResponseError } from "pocketbase";

const COLLECTION_NAME = "habitflow_sync_snapshots";
const OWNER_RULE = '@request.auth.id != "" && ownerId = @request.auth.id';
const CREATE_RULE = '@request.auth.id != "" && @request.body.ownerId = @request.auth.id';
const OWNER_ID_UNIQUE_INDEX =
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_habitflow_sync_snapshots_ownerId ON habitflow_sync_snapshots (ownerId)";

type FieldConfig = Record<string, unknown> & {
  name: string;
  type: string;
};

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

  const desiredFields: FieldConfig[] = [
    {
      name: "ownerId",
      type: "text",
      required: true,
      max: 0,
    },
    {
      name: "payload",
      type: "json",
      required: true,
      maxSize: 0,
    },
    {
      name: "exportedAt",
      type: "date",
      required: false,
    },
  ];

  try {
    const existing = await pb.collections.getOne(COLLECTION_NAME);
    let nextFields = (existing.fields ?? []) as FieldConfig[];
    for (const field of desiredFields) {
      nextFields = upsertField(nextFields, field);
    }

    const existingIndexes = Array.isArray(existing.indexes) ? existing.indexes : [];
    const hasUniqueOwnerId = existingIndexes.some(
      (idx) => /unique/i.test(idx) && /ownerid/i.test(idx)
    );
    const nextIndexes = hasUniqueOwnerId
      ? existingIndexes
      : [...existingIndexes, OWNER_ID_UNIQUE_INDEX];

    await pb.collections.update(existing.id, {
      name: COLLECTION_NAME,
      type: "base",
      fields: nextFields,
      indexes: nextIndexes,
      listRule: OWNER_RULE,
      viewRule: OWNER_RULE,
      createRule: CREATE_RULE,
      updateRule: OWNER_RULE,
      deleteRule: OWNER_RULE,
    });

    console.log(`Updated collection: ${COLLECTION_NAME}`);
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }

    await pb.collections.create({
      name: COLLECTION_NAME,
      type: "base",
      fields: desiredFields,
      indexes: [OWNER_ID_UNIQUE_INDEX],
      listRule: OWNER_RULE,
      viewRule: OWNER_RULE,
      createRule: CREATE_RULE,
      updateRule: OWNER_RULE,
      deleteRule: OWNER_RULE,
    });

    console.log(`Created collection: ${COLLECTION_NAME}`);
  } finally {
    pb.authStore.clear();
  }

  console.log("PocketBase HabitFlow sync collection is ready.");
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to set up PocketBase sync collection: ${message}`);
  process.exit(1);
});
