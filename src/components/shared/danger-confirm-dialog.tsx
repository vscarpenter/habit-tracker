"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DangerConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmWord: string;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
}

/** Body component: unmounts when dialog closes, so typed state resets naturally */
function DangerConfirmDialogBody({
  onOpenChange,
  title,
  description,
  confirmWord,
  confirmLabel = "Confirm",
  onConfirm,
}: Omit<DangerConfirmDialogProps, "open" | "className">) {
  const [typed, setTyped] = useState("");

  return (
    <DialogContent onClose={() => onOpenChange(false)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="mt-2">
        <label className="text-sm text-text-secondary" htmlFor="danger-confirm-input">
          Type <span className="font-mono font-bold text-error">{confirmWord}</span> to confirm
        </label>
        <Input
          id="danger-confirm-input"
          className="mt-2"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmWord}
          autoComplete="off"
        />
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={typed !== confirmWord}
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function DangerConfirmDialog({
  open,
  onOpenChange,
  ...bodyProps
}: DangerConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DangerConfirmDialogBody onOpenChange={onOpenChange} {...bodyProps} />
    </Dialog>
  );
}
