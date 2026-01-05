"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StaticDocSlug } from "@/lib/uploads/constants";

type DocItem = {
  id: string;
  slug: string;
  title: string;
  s3Key: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  updatedAt: string;
};

type StaticDocsManagerProps = {
  lang: string;
  tenantSlug: string;
  locale: string;
  publicBaseUrl: string;
  docs: DocItem[];
};

const slugOptions: StaticDocSlug[] = ["terms", "privacy"];
const acceptedDocTypes = "text/markdown,application/pdf";

export default function StaticDocsManager({
  lang,
  tenantSlug,
  locale,
  publicBaseUrl,
  docs,
}: StaticDocsManagerProps) {
  const initialDocs = useMemo(() => {
    const map = new Map<string, DocItem>();
    docs.forEach((doc) => map.set(doc.slug, doc));
    return map;
  }, [docs]);

  const [activeSlug, setActiveSlug] = useState<StaticDocSlug>("terms");
  const [docState, setDocState] = useState<Record<StaticDocSlug, DocItem | null>>({
    terms: initialDocs.get("terms") ?? null,
    privacy: initialDocs.get("privacy") ?? null,
  });
  const [titleState, setTitleState] = useState<Record<StaticDocSlug, string>>({
    terms: initialDocs.get("terms")?.title ?? "Terms of service",
    privacy: initialDocs.get("privacy")?.title ?? "Privacy policy",
  });
  const [fileState, setFileState] = useState<Record<StaticDocSlug, File | null>>({
    terms: null,
    privacy: null,
  });
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message?: string }>({
    type: "idle",
  });
  const [isUploading, setIsUploading] = useState(false);

  const activeDoc = docState[activeSlug];

  const handleUpload = async () => {
    const file = fileState[activeSlug];
    const title = titleState[activeSlug];

    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setStatus({ type: "idle" });

    try {
      const presignResponse = await fetch("/api/admin/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "DOC",
          mimeType: file.type,
          fileName: file.name,
          sizeBytes: file.size,
          slug: activeSlug,
          locale,
        }),
      });

      const presignPayload = await presignResponse.json();
      if (!presignResponse.ok) {
        throw new Error(presignPayload.error || "Failed to create upload.");
      }

      const formData = new FormData();
      Object.entries(presignPayload.fields ?? {}).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", file);

      const uploadResponse = await fetch(presignPayload.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to storage failed.");
      }

      const confirmResponse = await fetch("/api/admin/docs/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presignPayload.key,
          mimeType: file.type,
          sizeBytes: file.size,
          originalName: file.name,
          title,
          slug: activeSlug,
          locale,
        }),
      });

      const confirmPayload = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmPayload.error || "Failed to save document metadata.");
      }

      const newDoc = confirmPayload.staticDoc as DocItem;
      setDocState((prev) => ({ ...prev, [activeSlug]: newDoc }));
      setFileState((prev) => ({ ...prev, [activeSlug]: null }));
      setStatus({ type: "success", message: "Document uploaded." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container mx-auto px-6 py-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Static docs
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Documents
          </h1>
          <p className="mt-2 text-slate-600">
            Upload Terms and Privacy docs for your public site.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Active tenant: {tenantSlug} · Locale: {lang.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="container mx-auto space-y-8 px-6 py-8">
        <div className="flex flex-wrap gap-3">
          {slugOptions.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveSlug(slug)}
              className={
                slug === activeSlug
                  ? "rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700"
                  : "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-blue-200 hover:text-blue-600"
              }
            >
              {slug === "terms" ? "Terms" : "Privacy"}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {activeSlug === "terms" ? "Terms document" : "Privacy document"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload Markdown or PDF (default locale only).
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Document title
                  </label>
                  <input
                    value={titleState[activeSlug]}
                    onChange={(event) =>
                      setTitleState((prev) => ({
                        ...prev,
                        [activeSlug]: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Upload file
                  </label>
                  <input
                    type="file"
                    accept={acceptedDocTypes}
                    onChange={(event) =>
                      setFileState((prev) => ({
                        ...prev,
                        [activeSlug]: event.target.files?.[0] ?? null,
                      }))
                    }
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-slate-400">
                    Current locale: {locale.toUpperCase()}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={!fileState[activeSlug] || isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload document"}
                </Button>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Current document
                </div>
                {activeDoc ? (
                  <>
                    <div className="text-sm font-semibold text-slate-900">
                      {activeDoc.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {activeDoc.originalName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {activeDoc.mimeType} · {formatBytes(activeDoc.sizeBytes)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Updated {formatDate(activeDoc.updatedAt)}
                    </div>
                    <a
                      href={`${publicBaseUrl}/${locale}/docs/${activeSlug}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview public page
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No document uploaded yet.
                  </p>
                )}
              </div>
            </div>

            {status.type !== "idle" ? (
              <div
                className={
                  status.type === "error"
                    ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                }
              >
                {status.message}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
