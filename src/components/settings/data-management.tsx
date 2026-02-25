"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, Sprout, Layers3, Rocket } from "lucide-react";
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

const SAMPLE_IMPORTS = [
  {
    id: "starter",
    label: "Starter Sample",
    description: "5 habits and ~30 days of history",
    href: "/sample-data/habitflow-sample-starter.json",
    icon: Sprout,
  },
  {
    id: "standard",
    label: "Standard Sample",
    description: "13 habits and ~5 months of history",
    href: "/sample-data/habitflow-sample-standard.json",
    icon: Layers3,
  },
  {
    id: "power",
    label: "Power User Sample",
    description: "26 habits and ~1 year of history",
    href: "/sample-data/habitflow-sample-power-user.json",
    icon: Rocket,
  },
] as const;

export function DataManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{
    habits: number;
    completions: number;
    data: Parameters<typeof applyImport>[0];
    sourceLabel?: string;
  } | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  function openImportPreview(data: Parameters<typeof applyImport>[0], sourceLabel?: string) {
    setImportPreview({
      habits: data.data.habits.length,
      completions: data.data.completions.length,
      data,
      sourceLabel,
    });
  }

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

      openImportPreview(result.data!);
    } catch {
      toast("Could not read file. Make sure it's valid JSON.", "error");
    }
  }

  async function handleLoadSample(sample: (typeof SAMPLE_IMPORTS)[number]) {
    setLoadingSampleId(sample.id);
    try {
      const response = await fetch(sample.href, { cache: "no-store" });
      if (!response.ok) {
        toast(`Failed to load sample (${response.status})`, "error");
        return;
      }

      const raw = await response.json();
      const result = validateImportData(raw);
      if (!result.valid) {
        toast(`Invalid sample: ${result.errors?.[0] ?? "Unknown error"}`, "error");
        return;
      }

      openImportPreview(result.data!, sample.label);
    } catch {
      toast("Could not load sample data", "error");
    } finally {
      setLoadingSampleId(null);
    }
  }

  async function handleConfirmImport() {
    if (!importPreview) return;

    try {
      await applyImport(importPreview.data);
      toast("Data imported successfully");
      setImportPreview(null);
      window.location.href = "/";
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
        <div className="rounded-2xl border border-border-subtle/70 bg-surface-overlay/45 p-2">
          <Button variant="secondary" className="w-full justify-start gap-3" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>

        <div className="rounded-2xl border border-border-subtle/70 bg-surface-overlay/45 p-2">
          <Button
            variant="secondary"
            className="w-full justify-start gap-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import Data
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-error hover:text-error hover:bg-error/10"
          onClick={() => setClearOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
        <p className="text-xs text-text-muted">
          Export a backup before importing or clearing data.
        </p>

        <div className="rounded-2xl border border-border-subtle/70 bg-surface-overlay/35 p-3">
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Load Sample Data
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Quickly explore the app with prebuilt habits and completion history.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              After loading sample data, you&apos;ll be returned to Home.
            </p>
          </div>
          <div className="space-y-2">
            {SAMPLE_IMPORTS.map((sample) => {
              const Icon = sample.icon;
              const loading = loadingSampleId === sample.id;
              return (
                <div
                  key={sample.id}
                  className="rounded-xl border border-border-subtle/60 bg-surface-paper/40 p-2"
                >
                  <Button
                    variant="secondary"
                    className="h-auto w-full justify-start gap-3 px-3 py-2"
                    onClick={() => handleLoadSample(sample)}
                    disabled={Boolean(loadingSampleId)}
                  >
                    <span className="rounded-lg border border-border-subtle/70 bg-surface-overlay/60 p-1.5">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-sm">{loading ? "Loading..." : sample.label}</span>
                      <span className="block text-xs font-normal text-text-muted">
                        {sample.description}
                      </span>
                    </span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {/* Import preview dialog */}
      <Dialog open={importPreview !== null} onOpenChange={() => setImportPreview(null)}>
        <DialogContent onClose={() => setImportPreview(null)}>
          <DialogHeader>
            <DialogTitle>{importPreview?.sourceLabel ? "Load Sample Data" : "Import Data"}</DialogTitle>
            <DialogDescription>
              {importPreview?.sourceLabel ? (
                <>
                  This will load <strong>{importPreview.sourceLabel}</strong> and replace your
                  current data.
                </>
              ) : (
                <>This will replace all existing data with </>
              )}{" "}
              It includes {importPreview?.habits} habit
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
              {importPreview?.sourceLabel ? "Replace & Load Sample" : "Replace & Import"}
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
