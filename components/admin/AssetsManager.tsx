"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AssetItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type AssetsManagerProps = {
  lang: string;
  tenantSlug: string;
  assets: AssetItem[];
};

const acceptedAssetTypes =
  "image/jpeg,image/png,image/webp,image/gif";

export default function AssetsManager({
  lang,
  tenantSlug,
  assets,
}: AssetsManagerProps) {
  const [items, setItems] = useState<AssetItem[]>(assets);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message?: string }>({
    type: "idle",
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setStatus({ type: "idle" });

    try {
      const presignResponse = await fetch("/api/admin/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ASSET",
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
          sizeBytes: selectedFile.size,
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
      formData.append("file", selectedFile);

      const uploadResponse = await fetch(presignPayload.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to storage failed.");
      }

      const confirmResponse = await fetch("/api/admin/assets/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presignPayload.key,
          mimeType: selectedFile.type,
          sizeBytes: selectedFile.size,
          originalName: selectedFile.name,
        }),
      });

      const confirmPayload = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmPayload.error || "Failed to save asset metadata.");
      }

      const newAsset = confirmPayload.asset as AssetItem;
      setItems((prev) => [newAsset, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setStatus({ type: "success", message: "Asset uploaded." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ type: "success", message: "Asset URL copied." });
    } catch {
      setStatus({ type: "error", message: "Could not copy URL." });
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container mx-auto px-6 py-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Assets library
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Assets
          </h1>
          <p className="mt-2 text-slate-600">
            Upload images to reuse in your site builder and docs.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Active tenant: {tenantSlug} · Locale: {lang.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="container mx-auto space-y-8 px-6 py-8">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Upload a new image
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                JPEG, PNG, WEBP, or GIF up to 10MB.
              </p>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedAssetTypes}
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload asset"}
              </Button>
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

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Uploaded assets
            </h2>
            <span className="text-xs text-slate-400">
              {items.length} total
            </span>
          </div>
          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No assets uploaded yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="aspect-[4/3] w-full bg-slate-100">
                    <img
                      src={asset.url}
                      alt={asset.originalName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="space-y-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {asset.originalName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatBytes(asset.sizeBytes)} · {asset.mimeType}
                    </div>
                    <div className="text-xs text-slate-400">
                      Uploaded {formatDate(asset.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={() => handleCopy(asset.url)}
                      >
                        Copy URL
                      </Button>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Open
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
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
