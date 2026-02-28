import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncService } from "./sync-service";
import { authService } from "./auth-service";
import { getPocketBaseClient } from "./pocketbase-client";
import {
  applyImport,
  buildExportPayload,
  validateImportData,
  type ExportData,
} from "@/lib/export-import";
import { mergeSnapshots } from "./merge";

vi.mock("./auth-service", () => ({
  authService: {
    getUser: vi.fn(),
  },
}));

vi.mock("./pocketbase-client", () => ({
  getPocketBaseClient: vi.fn(),
}));

vi.mock("@/lib/export-import", () => ({
  applyImport: vi.fn(),
  buildExportPayload: vi.fn(),
  validateImportData: vi.fn(),
}));

vi.mock("./merge", () => ({
  mergeSnapshots: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeSnapshot(): ExportData {
  return {
    version: "1.0",
    exportedAt: "2026-02-28T00:00:00.000Z",
    app: "HabitFlow",
    data: {
      habits: [],
      completions: [],
      settings: {
        id: "user_settings",
        theme: "system",
        weekStartsOn: 0,
        showStreaks: true,
        showCompletionRate: true,
        defaultView: "today",
        syncEnabled: false,
        lastSyncedAt: null,
        createdAt: "2026-02-28T00:00:00.000Z",
        updatedAt: "2026-02-28T00:00:00.000Z",
      },
    },
  };
}

describe("syncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null on pull when user is not authenticated", async () => {
    vi.mocked(authService.getUser).mockResolvedValue(null);

    const result = await syncService.pull();

    expect(result).toBeNull();
    expect(getPocketBaseClient).not.toHaveBeenCalled();
  });

  it("returns null on pull when no remote snapshot record exists", async () => {
    vi.mocked(authService.getUser).mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      createdAt: "2026-02-28T00:00:00.000Z",
    });

    const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });
    vi.mocked(getPocketBaseClient).mockReturnValue({
      collection: vi.fn(() => ({ getFirstListItem })),
    } as never);

    const result = await syncService.pull();

    expect(result).toBeNull();
  });

  it("pull merges and applies remote payload when changes exist", async () => {
    const local = makeSnapshot();
    const merged = makeSnapshot();
    const mergeResult = {
      hasChanges: true,
      stats: { habitsUpdated: 1, completionsAdded: 0, settingsUpdated: false },
    };

    vi.mocked(authService.getUser).mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      createdAt: "2026-02-28T00:00:00.000Z",
    });

    const getFirstListItem = vi.fn().mockResolvedValue({ payload: makeSnapshot() });
    vi.mocked(getPocketBaseClient).mockReturnValue({
      collection: vi.fn(() => ({ getFirstListItem })),
    } as never);

    vi.mocked(validateImportData).mockReturnValue({ valid: true, data: makeSnapshot() });
    vi.mocked(buildExportPayload).mockResolvedValue(local);
    vi.mocked(mergeSnapshots).mockReturnValue({ merged, result: mergeResult });

    const result = await syncService.pull();

    expect(result).toEqual(mergeResult);
    expect(applyImport).toHaveBeenCalledWith(merged);
  });

  it("push updates existing snapshot when record already exists", async () => {
    const snapshot = makeSnapshot();

    vi.mocked(authService.getUser).mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      createdAt: "2026-02-28T00:00:00.000Z",
    });
    vi.mocked(buildExportPayload).mockResolvedValue(snapshot);

    const update = vi.fn().mockResolvedValue({});
    const getFirstListItem = vi.fn().mockResolvedValue({ id: "rec_1" });

    vi.mocked(getPocketBaseClient).mockReturnValue({
      collection: vi.fn(() => ({ getFirstListItem, update, create: vi.fn() })),
    } as never);

    await syncService.push();

    expect(update).toHaveBeenCalledWith(
      "rec_1",
      expect.objectContaining({
        ownerId: "user_1",
        payload: snapshot,
        exportedAt: snapshot.exportedAt,
      }),
      expect.any(Object)
    );
  });

  it("push creates snapshot when no existing record exists", async () => {
    const snapshot = makeSnapshot();

    vi.mocked(authService.getUser).mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      createdAt: "2026-02-28T00:00:00.000Z",
    });
    vi.mocked(buildExportPayload).mockResolvedValue(snapshot);

    const create = vi.fn().mockResolvedValue({});
    const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });

    vi.mocked(getPocketBaseClient).mockReturnValue({
      collection: vi.fn(() => ({ getFirstListItem, create, update: vi.fn() })),
    } as never);

    await syncService.push();

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: "user_1",
        payload: snapshot,
        exportedAt: snapshot.exportedAt,
      }),
      expect.any(Object)
    );
  });
});
