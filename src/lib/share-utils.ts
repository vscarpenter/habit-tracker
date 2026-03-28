/**
 * Utility functions for downloading and sharing canvas-based progress cards.
 */

export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function copyCanvasToPNG(canvas: HTMLCanvasElement): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, "image/png");
  });
}
