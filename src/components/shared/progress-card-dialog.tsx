"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast";
import { downloadCanvasAsPNG, copyCanvasToPNG } from "@/lib/share-utils";

interface ProgressCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filename: string;
  renderCard: (canvas: HTMLCanvasElement) => void;
}

export function ProgressCardDialog({
  open,
  onOpenChange,
  title,
  filename,
  renderCard,
}: ProgressCardDialogProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generateCard = useCallback(() => {
    // Lazy import to avoid SSR issues with canvas
    import("@/lib/progress-card-renderer").then(({ createCardCanvas }) => {
      const canvas = createCardCanvas();
      renderCard(canvas);
      canvasRef.current = canvas;
      setPreviewUrl(canvas.toDataURL("image/png"));
    });
  }, [renderCard]);

  useEffect(() => {
    if (open) {
      generateCard();
    } else {
      setPreviewUrl(null);
      canvasRef.current = null;
    }
  }, [open, generateCard]);

  function handleDownload() {
    if (!canvasRef.current) return;
    downloadCanvasAsPNG(canvasRef.current, filename);
    toast("Download started");
  }

  async function handleCopy() {
    if (!canvasRef.current) return;
    const success = await copyCanvasToPNG(canvasRef.current);
    toast(success ? "Copied to clipboard" : "Could not copy to clipboard", success ? "success" : "error");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div ref={previewRef} className="overflow-hidden rounded-xl border border-border-subtle">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Progress card preview"
              className="w-full"
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-text-muted">
              Generating...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="secondary" onClick={handleCopy} disabled={!previewUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="primary" onClick={handleDownload} disabled={!previewUrl}>
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
