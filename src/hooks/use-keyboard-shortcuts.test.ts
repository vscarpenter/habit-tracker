import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, type ShortcutConfig } from "./use-keyboard-shortcuts";

// Mock useIsDesktop
let isDesktop = true;
vi.mock("./use-media-query", () => ({
  useIsDesktop: () => isDesktop,
}));

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    ...opts,
  });
  document.dispatchEvent(event);
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    isDesktop = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls handler when key matches", () => {
    const handler = vi.fn();
    const shortcuts: ShortcutConfig[] = [{ key: "n", handler }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey("n");

    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not call handler on mobile", () => {
    isDesktop = false;
    const handler = vi.fn();
    const shortcuts: ShortcutConfig[] = [{ key: "n", handler }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey("n");

    expect(handler).not.toHaveBeenCalled();
  });

  it("skips handler when focused on an input", () => {
    const handler = vi.fn();
    const shortcuts: ShortcutConfig[] = [{ key: "n", handler }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", { key: "n", bubbles: true });
    input.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("handles ctrlOrCmd modifier", () => {
    const handler = vi.fn();
    const shortcuts: ShortcutConfig[] = [
      { key: "k", ctrlOrCmd: true, handler },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Without modifier — should NOT fire
    fireKey("k");
    expect(handler).not.toHaveBeenCalled();

    // With meta key — should fire
    fireKey("k", { metaKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not call handler when enabled is false", () => {
    const handler = vi.fn();
    const shortcuts: ShortcutConfig[] = [
      { key: "n", handler, enabled: false },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey("n");

    expect(handler).not.toHaveBeenCalled();
  });
});
