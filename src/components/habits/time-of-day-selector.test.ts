import { describe, it, expect } from "vitest";
import { inferTimeOfDay } from "./time-of-day-selector";

describe("inferTimeOfDay", () => {
  it("returns morning for 05:00-11:59", () => {
    expect(inferTimeOfDay("05:00")).toBe("morning");
    expect(inferTimeOfDay("08:30")).toBe("morning");
    expect(inferTimeOfDay("11:59")).toBe("morning");
  });

  it("returns afternoon for 12:00-17:59", () => {
    expect(inferTimeOfDay("12:00")).toBe("afternoon");
    expect(inferTimeOfDay("15:30")).toBe("afternoon");
    expect(inferTimeOfDay("17:59")).toBe("afternoon");
  });

  it("returns evening for 18:00-23:59", () => {
    expect(inferTimeOfDay("18:00")).toBe("evening");
    expect(inferTimeOfDay("21:00")).toBe("evening");
    expect(inferTimeOfDay("23:59")).toBe("evening");
  });

  it("returns anytime for early morning (00:00-04:59)", () => {
    expect(inferTimeOfDay("00:00")).toBe("anytime");
    expect(inferTimeOfDay("04:59")).toBe("anytime");
  });

  it("returns anytime for invalid input", () => {
    expect(inferTimeOfDay("")).toBe("anytime");
    expect(inferTimeOfDay("invalid")).toBe("anytime");
  });
});
