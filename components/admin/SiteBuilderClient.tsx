"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Puck } from "@measured/puck";

import { Button } from "@/components/ui/button";
import { puckConfig } from "@/lib/puck/config";
import type { PuckDataShape } from "@/lib/puck/types";
import { publishSiteAction, saveDraftAction } from "@/lib/puck/actions";

type SiteBuilderClientProps = {
  tenantId: string;
  lang: string;
  publicUrl: string;
  initialData: PuckDataShape;
  lastSavedAt?: string | null;
  lastPublishedAt?: string | null;
  canPublish: boolean;
};

export default function SiteBuilderClient({
  tenantId,
  lang,
  publicUrl,
  initialData,
  lastSavedAt,
  lastPublishedAt,
  canPublish,
}: SiteBuilderClientProps) {
  const [data, setData] = useState<PuckDataShape>(initialData);
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message?: string }>({
    type: "idle",
  });
  const [savedAt, setSavedAt] = useState<string | null>(lastSavedAt ?? null);
  const [publishedAt, setPublishedAt] = useState<string | null>(
    lastPublishedAt ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutosaving = useRef(false);
  const lastSavedSnapshot = useRef<string>(JSON.stringify(initialData));

  const handleChange = (next: PuckDataShape) => {
    setData(next);
    setHasUnsavedChanges(true);
    if (saveIndicator === "saved") {
      setSaveIndicator("idle");
    }
  };

  const setSavedIndicator = () => {
    setSaveIndicator("saved");
    if (saveIndicatorTimer.current) {
      clearTimeout(saveIndicatorTimer.current);
    }
    saveIndicatorTimer.current = setTimeout(() => {
      setSaveIndicator("idle");
    }, 1000);
  };

  const handleSave = () => {
    setSaveIndicator("saving");
    startTransition(async () => {
      setStatus({ type: "idle" });
      const result = await saveDraftAction({ tenantId, lang, data });
      if (result.error) {
        setStatus({ type: "error", message: result.error });
        setSaveIndicator("idle");
        return;
      }
      if (result.savedAt) {
        setSavedAt(result.savedAt);
      }
      lastSavedSnapshot.current = JSON.stringify(data);
      setHasUnsavedChanges(false);
      setSavedIndicator();
      setStatus({ type: "success", message: "Draft saved." });
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      setStatus({ type: "idle" });
      const result = await publishSiteAction({ tenantId, lang });
      if (result.error) {
        setStatus({ type: "error", message: result.error });
        return;
      }
      if (result.publishedAt) {
        setPublishedAt(result.publishedAt);
      }
      setStatus({ type: "success", message: "Site published." });
    });
  };

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = setTimeout(() => {
      const snapshot = JSON.stringify(data);
      if (snapshot === lastSavedSnapshot.current || isAutosaving.current) {
        setHasUnsavedChanges(false);
        return;
      }
      isAutosaving.current = true;
      setSaveIndicator("saving");
      startTransition(async () => {
        try {
          const result = await saveDraftAction({ tenantId, lang, data });
          if (result.error) {
            setStatus({ type: "error", message: result.error });
            setSaveIndicator("idle");
            return;
          }
          if (result.savedAt) {
            setSavedAt(result.savedAt);
          }
          lastSavedSnapshot.current = snapshot;
          setHasUnsavedChanges(false);
          setSavedIndicator();
        } finally {
          isAutosaving.current = false;
        }
      });
    }, 2000);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
      if (saveIndicatorTimer.current) {
        clearTimeout(saveIndicatorTimer.current);
      }
    };
  }, [data, hasUnsavedChanges, lang, tenantId, startTransition]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Site Builder
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Manage site content
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Locale: {lang.toUpperCase()}
            </p>
            <div className="mt-2 text-xs text-slate-400">
              {savedAt ? `Last saved ${formatTimestamp(savedAt)}` : "Not saved yet"}
              {publishedAt
                ? ` - Last published ${formatTimestamp(publishedAt)}`
                : " - Not published"}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={publicUrl}
              className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              View live site
            </a>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleSave}
              disabled={isPending}
            >
              {saveIndicator === "saving"
                ? "Saving..."
                : saveIndicator === "saved"
                  ? "Saved"
                  : "Save draft"}
            </Button>
            <Button
              type="button"
              size="default"
              onClick={handlePublish}
              disabled={isPending || !canPublish}
            >
              Publish
            </Button>
          </div>
        </div>
        {status.type !== "idle" ? (
          <div
            className={
              status.type === "error"
                ? "border-t border-red-200 bg-red-50 text-red-700"
                : "border-t border-emerald-200 bg-emerald-50 text-emerald-700"
            }
          >
            <div className="container mx-auto px-6 py-2 text-xs">
              {status.message}
            </div>
          </div>
        ) : null}
        {!canPublish ? (
          <div className="border-t border-amber-200 bg-amber-50">
            <div className="container mx-auto px-6 py-2 text-xs text-amber-700">
              You have read-only publishing permissions. Ask an admin to publish changes.
            </div>
          </div>
        ) : null}
      </header>

      <div className="min-h-screen bg-slate-50">
        <Puck
          config={puckConfig}
          data={data}
          onChange={handleChange}
          overrides={{ headerActions: () => <></> }}
        />
      </div>
    </div>
  );
}

function formatTimestamp(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
