import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completionSyncService,
  scheduleCompletionPush,
  scheduleCompletionDelete,
} from "./completion-sync-service";
import { getPocketBaseClient } from "./pocketbase-client";
import { authService } from "./auth-service";
import { createCompletion, resetFactories } from "@/test/factories";

vi.mock("./pocketbase-client", () => ({
  getPocketBaseClient: vi.fn(),
}));

vi.mock("./auth-service", () => ({
  authService: {
    getUser: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function mockCollection(methods: Record<string, unknown>) {
  vi.mocked(getPocketBaseClient).mockReturnValue({
    collection: vi.fn(() => methods),
  } as never);
  return methods;
}

describe("completionSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFactories();
  });

  describe("pushCompletion", () => {
    it("updates existing record when one is found", async () => {
      const update = vi.fn().mockResolvedValue({});
      const getFirstListItem = vi.fn().mockResolvedValue({ id: "rec_1" });
      mockCollection({ getFirstListItem, update, create: vi.fn() });

      await completionSyncService.pushCompletion("user_1", createCompletion({ id: "local-id-1", habitId: "habit-1", date: "2026-02-28", completedAt: "2026-02-28T10:00:00.000Z" }));

      expect(update).toHaveBeenCalledWith(
        "rec_1",
        expect.objectContaining({
          ownerId: "user_1",
          habitId: "habit-1",
          date: "2026-02-28",
          localId: "local-id-1",
        }),
        expect.any(Object)
      );
    });

    it("creates new record when none exists", async () => {
      const create = vi.fn().mockResolvedValue({});
      const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });
      mockCollection({ getFirstListItem, create, update: vi.fn() });

      await completionSyncService.pushCompletion("user_1", createCompletion({ id: "local-id-1", habitId: "habit-1", date: "2026-02-28", completedAt: "2026-02-28T10:00:00.000Z" }));

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: "user_1",
          habitId: "habit-1",
          localId: "local-id-1",
        }),
        expect.any(Object)
      );
    });

    it("silently handles duplicate create (unique violation)", async () => {
      const create = vi.fn().mockRejectedValue({
        status: 400,
        response: { message: "Value must be unique" },
      });
      const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });
      mockCollection({ getFirstListItem, create, update: vi.fn() });

      // Should not throw
      await completionSyncService.pushCompletion("user_1", createCompletion({ id: "local-id-1", habitId: "habit-1", date: "2026-02-28", completedAt: "2026-02-28T10:00:00.000Z" }));
    });

    it("throws on non-unique create failure", async () => {
      const create = vi.fn().mockRejectedValue({
        status: 400,
        response: { message: "Validation failed" },
      });
      const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });
      mockCollection({ getFirstListItem, create, update: vi.fn() });

      await expect(
        completionSyncService.pushCompletion("user_1", createCompletion({ id: "local-id-1", habitId: "habit-1", date: "2026-02-28", completedAt: "2026-02-28T10:00:00.000Z" }))
      ).rejects.toEqual(
        expect.objectContaining({
          status: 400,
        })
      );
    });
  });

  describe("deleteCompletion", () => {
    it("finds and deletes matching record", async () => {
      const deleteFn = vi.fn().mockResolvedValue({});
      const getFirstListItem = vi.fn().mockResolvedValue({ id: "rec_1" });
      mockCollection({ getFirstListItem, delete: deleteFn });

      await completionSyncService.deleteCompletion("user_1", "habit-1", "2026-02-28", "local-1");

      expect(deleteFn).toHaveBeenCalledWith("rec_1", expect.any(Object));
    });

    it("silently handles already-deleted record", async () => {
      const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });
      mockCollection({ getFirstListItem, delete: vi.fn() });

      // Should not throw
      await completionSyncService.deleteCompletion("user_1", "habit-1", "2026-02-28", "local-1");
    });
  });

  describe("subscribe", () => {
    it("sets up subscription with user filter", () => {
      const subscribeFn = vi.fn().mockResolvedValue(vi.fn());
      mockCollection({ subscribe: subscribeFn });

      const onChange = vi.fn();
      completionSyncService.subscribe("user_1", onChange);

      expect(subscribeFn).toHaveBeenCalledWith(
        "*",
        expect.any(Function),
        expect.objectContaining({ filter: 'ownerId="user_1"' })
      );
    });

    it("calls onChange with create events for matching user", () => {
      let capturedCallback: (event: Record<string, unknown>) => void = () => {};
      const subscribeFn = vi.fn().mockImplementation(
        (_topic: string, cb: (event: Record<string, unknown>) => void) => {
          capturedCallback = cb;
          return Promise.resolve(vi.fn());
        }
      );
      mockCollection({ subscribe: subscribeFn });

      const onChange = vi.fn();
      completionSyncService.subscribe("user_1", onChange);

      // Simulate incoming event
      capturedCallback({
        action: "create",
        record: {
          ownerId: "user_1",
          habitId: "habit-1",
          date: "2026-02-28",
          completedAt: "2026-02-28T10:00:00.000Z",
          note: "",
          localId: "remote-id-1",
        },
      });

      expect(onChange).toHaveBeenCalledWith({
        action: "create",
        completion: expect.objectContaining({
          habitId: "habit-1",
          date: "2026-02-28",
          localId: "remote-id-1",
        }),
      });
    });

    it("ignores events from other users", () => {
      let capturedCallback: (event: Record<string, unknown>) => void = () => {};
      const subscribeFn = vi.fn().mockImplementation(
        (_topic: string, cb: (event: Record<string, unknown>) => void) => {
          capturedCallback = cb;
          return Promise.resolve(vi.fn());
        }
      );
      mockCollection({ subscribe: subscribeFn });

      const onChange = vi.fn();
      completionSyncService.subscribe("user_1", onChange);

      capturedCallback({
        action: "create",
        record: {
          ownerId: "other_user",
          habitId: "habit-1",
          date: "2026-02-28",
          completedAt: "2026-02-28T10:00:00.000Z",
          localId: "x",
        },
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("suppresses self-echo events", async () => {
      // First, push a completion to mark its localId
      const update = vi.fn().mockResolvedValue({});
      const getFirstListItem = vi.fn().mockResolvedValue({ id: "rec_1" });
      const subscribeFn = vi.fn();
      let capturedCallback: (event: Record<string, unknown>) => void = () => {};

      subscribeFn.mockImplementation(
        (_topic: string, cb: (event: Record<string, unknown>) => void) => {
          capturedCallback = cb;
          return Promise.resolve(vi.fn());
        }
      );

      mockCollection({ getFirstListItem, update, create: vi.fn(), subscribe: subscribeFn });

      const completion = createCompletion({ id: "echo-test-id", habitId: "habit-1", date: "2026-02-28", completedAt: "2026-02-28T10:00:00.000Z" });
      await completionSyncService.pushCompletion("user_1", completion);

      const onChange = vi.fn();
      completionSyncService.subscribe("user_1", onChange);

      // Simulate the echo event coming back
      capturedCallback({
        action: "create",
        record: {
          ownerId: "user_1",
          habitId: "habit-1",
          date: "2026-02-28",
          completedAt: "2026-02-28T10:00:00.000Z",
          localId: "echo-test-id",
        },
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("returns an unsubscribe function", () => {
      const unsubFn = vi.fn();
      const subscribeFn = vi.fn().mockResolvedValue(unsubFn);
      mockCollection({ subscribe: subscribeFn });

      const unsub = completionSyncService.subscribe("user_1", vi.fn());
      expect(typeof unsub).toBe("function");
    });
  });

  describe("pullAllCompletions", () => {
    it("returns mapped completions from PocketBase", async () => {
      const getFullList = vi.fn().mockResolvedValue([
        {
          habitId: "h1",
          date: "2026-02-28",
          completedAt: "2026-02-28T10:00:00.000Z",
          note: "done",
          localId: "id-1",
        },
      ]);
      mockCollection({ getFullList });

      const result = await completionSyncService.pullAllCompletions("user_1");

      expect(result).toEqual([
        {
          habitId: "h1",
          date: "2026-02-28",
          completedAt: "2026-02-28T10:00:00.000Z",
          note: "done",
          localId: "id-1",
        },
      ]);
    });

    it("throws on failure so callers can distinguish errors from empty data", async () => {
      const getFullList = vi.fn().mockRejectedValue(new Error("network"));
      mockCollection({ getFullList });

      await expect(
        completionSyncService.pullAllCompletions("user_1")
      ).rejects.toThrow("network");
    });
  });
});

describe("fire-and-forget wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFactories();
  });

  it("scheduleCompletionPush skips when not authenticated", async () => {
    vi.mocked(authService.getUser).mockResolvedValue(null);

    await scheduleCompletionPush(createCompletion({ id: "local-id-1", habitId: "habit-1", date: "2026-02-28", completedAt: "2026-02-28T10:00:00.000Z" }));

    expect(getPocketBaseClient).not.toHaveBeenCalled();
  });

  it("scheduleCompletionPush calls pushCompletion when authenticated", async () => {
    vi.mocked(authService.getUser).mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      createdAt: "2026-02-28T00:00:00.000Z",
    });

    const update = vi.fn().mockResolvedValue({});
    const getFirstListItem = vi.fn().mockResolvedValue({ id: "rec_1" });
    mockCollection({ getFirstListItem, update, create: vi.fn() });

    await scheduleCompletionPush(createCompletion({ id: "local-id-1", habitId: "habit-1", date: "2026-02-28", completedAt: "2026-02-28T10:00:00.000Z" }));

    expect(update).toHaveBeenCalled();
  });

  it("scheduleCompletionDelete skips when not authenticated", async () => {
    vi.mocked(authService.getUser).mockResolvedValue(null);

    await scheduleCompletionDelete("habit-1", "2026-02-28", "local-1");

    expect(getPocketBaseClient).not.toHaveBeenCalled();
  });
});
