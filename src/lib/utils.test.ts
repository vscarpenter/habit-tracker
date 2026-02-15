import { describe, it, expect } from "vitest";
import { cn, ACCENT_COLORS, MAX_ACTIVE_HABITS } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges conflicting tailwind classes", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("constants", () => {
  it("defines 8 accent colors", () => {
    expect(ACCENT_COLORS).toHaveLength(8);
  });

  it("sets max active habits to 50", () => {
    expect(MAX_ACTIVE_HABITS).toBe(50);
  });
});
