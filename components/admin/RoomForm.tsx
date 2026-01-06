"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMessages } from "@/lib/i18n/messages";

type AssetOption = {
  id: string;
  url: string;
  originalName: string;
};

type RoomFormData = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  amenities: string[];
  maxGuests: number | null;
  isActive: boolean;
  assetIds: string[];
};

type RoomFormProps = {
  lang: string;
  tenantSlug: string;
  mode: "create" | "edit";
  initialRoom?: RoomFormData;
  assets: AssetOption[];
};

type StatusState =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

export default function RoomForm({
  lang,
  tenantSlug,
  mode,
  initialRoom,
  assets,
}: RoomFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<RoomFormData>(
    initialRoom ?? {
      name: "",
      slug: "",
      description: "",
      amenities: [],
      maxGuests: null,
      isActive: true,
      assetIds: [],
    },
  );
  const [amenitiesInput, setAmenitiesInput] = useState(
    initialRoom?.amenities.join(", ") ?? "",
  );
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [isSaving, setIsSaving] = useState(false);
  const copy = getMessages(lang).admin.roomForm;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target as HTMLInputElement;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (event.target as HTMLInputElement).checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaxGuestsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      maxGuests: value ? Number(value) : null,
    }));
  };

  const toggleAsset = (assetId: string) => {
    setForm((prev) => {
      const exists = prev.assetIds.includes(assetId);
      const nextIds = exists
        ? prev.assetIds.filter((id) => id !== assetId)
        : [...prev.assetIds, assetId];
      return { ...prev, assetIds: nextIds };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    const amenities = amenitiesInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!form.name.trim() || !form.description.trim()) {
      setStatus({ type: "error", message: copy.requiredError });
      return;
    }

    setIsSaving(true);
    setStatus({ type: "idle" });

    try {
      const response = await fetch(
        mode === "create" ? "/api/admin/rooms" : `/api/admin/rooms/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug || null,
            description: form.description,
            amenities,
            maxGuests: form.maxGuests,
            isActive: form.isActive,
            assetIds: form.assetIds,
          }),
        },
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.saveError);
      }

      setStatus({ type: "success", message: copy.saveSuccess });
      if (mode === "create" && payload.room?.id) {
        router.push(`/${lang}/rooms/${payload.room.id}/edit`);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : copy.saveError,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              {mode === "create" ? copy.createTitle : copy.editTitle}
            </h1>
            <p className="mt-2 text-slate-600">
              {copy.description}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {copy.activeTenant}: {tenantSlug} | {copy.locale}: {lang.toUpperCase()}
            </p>
          </div>
          <Link
            href={`/${lang}/rooms`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            {copy.backToRooms}
          </Link>
        </div>
      </div>

      <div className="container mx-auto space-y-8 px-6 py-8">
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="name">
                    {copy.roomName}
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                    placeholder={copy.roomNamePlaceholder}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="slug">
                    {copy.slugLabel}
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                    placeholder={copy.slugPlaceholder}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="description">
                  {copy.descriptionLabel}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  placeholder={copy.descriptionPlaceholder}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="amenities">
                    {copy.amenitiesLabel}
                  </label>
                  <input
                    id="amenities"
                    name="amenities"
                    value={amenitiesInput}
                    onChange={(event) => setAmenitiesInput(event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                    placeholder={copy.amenitiesPlaceholder}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="maxGuests">
                    {copy.maxGuests}
                  </label>
                  <input
                    id="maxGuests"
                    name="maxGuests"
                    type="number"
                    min={1}
                    value={form.maxGuests ?? ""}
                    onChange={handleMaxGuestsChange}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                    placeholder="2"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                {copy.activeRoom}
              </label>

              <div>
                <h3 className="text-sm font-semibold text-slate-700">
                  {copy.galleryTitle}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {copy.galleryHint}
                </p>
                {assets.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    {copy.noAssets}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {assets.map((asset) => {
                      const isSelected = form.assetIds.includes(asset.id);
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => toggleAsset(asset.id)}
                          className={`overflow-hidden rounded-2xl border text-left transition ${
                            isSelected ? "border-blue-300" : "border-slate-200"
                          }`}
                        >
                          <div className="aspect-[4/3] w-full bg-slate-100">
                            <img
                              src={asset.url}
                              alt={asset.originalName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-600">
                            <span className="truncate">{asset.originalName}</span>
                            <span className="font-semibold">
                              {isSelected ? copy.selected : copy.select}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? copy.saving : copy.saveRoom}
                </Button>
                {status.type !== "idle" ? (
                  <div
                    className={
                      status.type === "error"
                        ? "rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700"
                        : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700"
                    }
                  >
                    {status.message}
                  </div>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
