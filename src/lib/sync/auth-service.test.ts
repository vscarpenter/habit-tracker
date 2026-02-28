import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./auth-service";
import { getPocketBaseClient } from "./pocketbase-client";

vi.mock("./pocketbase-client", () => ({
  getPocketBaseClient: vi.fn(),
}));

type MockAuthStore = {
  isValid: boolean;
  record: Record<string, unknown> | null;
  clear: ReturnType<typeof vi.fn>;
  onChange: ReturnType<typeof vi.fn>;
};

type MockPocketBase = {
  authStore: MockAuthStore;
  collection: ReturnType<typeof vi.fn>;
};

function makeClient(overrides: Partial<MockAuthStore> = {}): MockPocketBase {
  const authStore: MockAuthStore = {
    isValid: false,
    record: null,
    clear: vi.fn(),
    onChange: vi.fn(() => vi.fn()),
    ...overrides,
  };

  const collection = vi.fn(() => ({
    authWithOAuth2: vi.fn().mockResolvedValue({}),
  }));

  return { authStore, collection };
}

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no authenticated user exists", async () => {
    const client = makeClient();
    vi.mocked(getPocketBaseClient).mockReturnValue(client as never);

    const user = await authService.getUser();

    expect(user).toBeNull();
  });

  it("maps the auth record into SyncUser", async () => {
    const client = makeClient({
      isValid: true,
      record: {
        id: "user_123",
        email: "user@example.com",
        created: "2026-02-28T00:00:00.000Z",
      },
    });
    vi.mocked(getPocketBaseClient).mockReturnValue(client as never);

    const user = await authService.getUser();

    expect(user).toEqual({
      id: "user_123",
      email: "user@example.com",
      createdAt: "2026-02-28T00:00:00.000Z",
    });
  });

  it("calls Google OAuth auth on users collection", async () => {
    const authWithOAuth2 = vi.fn().mockResolvedValue({});
    const client = makeClient();
    client.collection = vi.fn(() => ({ authWithOAuth2 }));
    vi.mocked(getPocketBaseClient).mockReturnValue(client as never);

    await authService.signInWithGoogle();

    expect(client.collection).toHaveBeenCalledWith("users");
    expect(authWithOAuth2).toHaveBeenCalledWith({ provider: "google" });
  });

  it("clears auth store on sign out", async () => {
    const client = makeClient();
    vi.mocked(getPocketBaseClient).mockReturnValue(client as never);

    await authService.signOut();

    expect(client.authStore.clear).toHaveBeenCalledTimes(1);
  });

  it("subscribes to auth changes and maps callback user", () => {
    const unsubscribe = vi.fn();
    const callbackHandler = vi.fn();

    const client = makeClient({
      isValid: true,
      record: {
        id: "user_abc",
        email: "abc@example.com",
        created: "2026-02-28T01:00:00.000Z",
      },
      onChange: vi.fn((cb: () => void) => {
        callbackHandler.mockImplementation(cb);
        return unsubscribe;
      }),
    });

    vi.mocked(getPocketBaseClient).mockReturnValue(client as never);

    const cb = vi.fn();
    const remove = authService.onAuthChange(cb);

    callbackHandler();

    expect(cb).toHaveBeenCalledWith({
      id: "user_abc",
      email: "abc@example.com",
      createdAt: "2026-02-28T01:00:00.000Z",
    });

    remove();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
