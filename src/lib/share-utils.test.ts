import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCanvasAsPNG } from "./share-utils";

describe("downloadCanvasAsPNG", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers a download with the correct filename", () => {
    const clickSpy = vi.fn();
    const fakeAnchor = { download: "", href: "", click: clickSpy };
    vi.spyOn(document, "createElement").mockReturnValue(fakeAnchor as unknown as HTMLAnchorElement);

    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock"),
    } as unknown as HTMLCanvasElement;

    downloadCanvasAsPNG(mockCanvas, "test-card.png");

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(fakeAnchor.download).toBe("test-card.png");
    expect(fakeAnchor.href).toBe("data:image/png;base64,mock");
    expect(clickSpy).toHaveBeenCalled();
  });
});
