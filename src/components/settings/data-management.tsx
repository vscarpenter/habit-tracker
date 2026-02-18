"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DangerConfirmDialog } from "@/components/shared/danger-confirm-dialog";
import { useToast } from "@/components/shared/toast";
import {
  buildExportPayload,
  downloadJson,
  parseImportFile,
  validateImportData,
  applyImport,
  clearAllData,
} from "@/lib/export-import";

const CLEAR_CONFIRM_WORD = "DELETE";

export function DataManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{
    habits: number;
    completions: number;
    data: Parameters<typeof applyImport>[0];
  } | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  async function handleExport() {
    try {
      const payload = await buildExportPayload();
      downloadJson(payload);
      toast("Data exported successfully");
    } catch {
      toast("Failed to export data", "error");
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = "";

    try {
      const raw = await parseImportFile(file);
      const result = validateImportData(raw);

      if (!result.valid) {
        toast(`Invalid file: ${result.errors?.[0] ?? "Unknown error"}`, "error");
        return;
      }

      setImportPreview({
        habits: result.data!.data.habits.length,
        completions: result.data!.data.completions.length,
        data: result.data!,
      });
    } catch {
      toast("Could not read file. Make sure it's valid JSON.", "error");
    }
  }

  async function handleConfirmImport() {
    if (!importPreview) return;

    try {
      await applyImport(importPreview.data);
      toast("Data imported successfully");
      setImportPreview(null);
      window.location.reload();
    } catch {
      toast("Failed to import data", "error");
    }
  }

  async function handleClear() {
    try {
      await clearAllData();
      toast("All data cleared");
      window.location.href = "/";
    } catch {
      toast("Failed to clear data", "error");
    }
  }

  return (
    <>
      <div className="space-y-3">
        <Button variant="secondary" className="w-full justify-start gap-3" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export Data
        </Button>

        <Button
          variant="secondary"
          className="w-full justify-start gap-3"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelected}
        />

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-error hover:text-error hover:bg-error/10"
          onClick={() => setClearOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
      </div>

      {/* Import preview dialog */}
      <Dialog open={importPreview !== null} onOpenChange={() => setImportPreview(null)}>
        <DialogContent onClose={() => setImportPreview(null)}>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              This will replace all existing data with {importPreview?.habits} habit
              {importPreview?.habits !== 1 ? "s" : ""} and{" "}
              {importPreview?.completions} completion
              {importPreview?.completions !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportPreview(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmImport}>
              Replace &amp; Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all data dialog */}
      <DangerConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear All Data"
        description="This will permanently delete all habits, completions, and settings. This action cannot be undone."
        confirmWord={CLEAR_CONFIRM_WORD}
        confirmLabel="Delete Everything"
        onConfirm={handleClear}
      />
    </>
  );
}
