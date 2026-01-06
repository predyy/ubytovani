"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isValidDateRange, parseDateOnly } from "@/lib/dates";
import { formatMessage, getMessages } from "@/lib/i18n/messages";

type AvailabilityBlockItem = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  roomId: string | null;
  roomName: string;
  createdAt: string;
};

type AvailabilityManagerProps = {
  lang: string;
  tenantSlug: string;
  rooms: Array<{ id: string; name: string; isActive: boolean }>;
  blocks: AvailabilityBlockItem[];
};

type StatusState =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

const initialFormState = {
  roomId: "",
  startDate: "",
  endDate: "",
  reason: "",
};

function getRangeNights(start: string, end: string) {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export default function AvailabilityManager({
  lang,
  tenantSlug,
  rooms,
  blocks,
}: AvailabilityManagerProps) {
  const [items, setItems] = useState<AvailabilityBlockItem[]>(blocks);
  const [form, setForm] = useState({
    ...initialFormState,
    roomId: initialFormState.roomId || rooms[0]?.id || "",
  });
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const copy = getMessages(lang).admin.availability;

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (isSubmitting) {
      return;
    }

    const startDate = parseDateOnly(form.startDate);
    const endDate = parseDateOnly(form.endDate);

    if (!form.roomId) {
      setStatus({ type: "error", message: copy.selectRoomError });
      return;
    }

    if (!startDate || !endDate || !isValidDateRange(startDate, endDate)) {
      setStatus({ type: "error", message: copy.invalidRangeError });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const response = await fetch("/api/admin/availability/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: form.roomId,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.createFailure);
      }

      const newBlock = payload.block as AvailabilityBlockItem;
      setItems((prev) => [newBlock, ...prev]);
      setForm((prev) => ({
        ...initialFormState,
        roomId: prev.roomId,
      }));
      setStatus({ type: "success", message: copy.createSuccess });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : copy.createFailure,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (blockId: string) => {
    if (deletingId) {
      return;
    }

    setDeletingId(blockId);
    setStatus({ type: "idle" });

    try {
      const response = await fetch(`/api/admin/availability/blocks/${blockId}`,
        { method: "DELETE" },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.deleteFailure);
      }

      setItems((prev) => prev.filter((block) => block.id !== blockId));
      setStatus({ type: "success", message: copy.deleteSuccess });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : copy.deleteFailure,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container mx-auto px-6 py-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            {copy.title}
          </h1>
          <p className="mt-2 text-slate-600">
            {copy.description}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {copy.activeTenant}: {tenantSlug} | {copy.locale}: {lang.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="container mx-auto space-y-8 px-6 py-8">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {copy.createTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {copy.createHint}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="roomId">
                  {copy.roomLabel}
                </label>
                <select
                  id="roomId"
                  name="roomId"
                  value={form.roomId}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                      {room.isActive ? "" : copy.roomInactive}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="startDate">
                  {copy.startDate}
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="endDate">
                  {copy.endDate}
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  min={form.startDate || undefined}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="reason">
                  {copy.reasonLabel}
                </label>
                <input
                  id="reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder={copy.reasonPlaceholder}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
            </div>
            <Button type="button" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? copy.saving : copy.createButton}
            </Button>
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
              {copy.upcomingTitle}
            </h2>
            <span className="text-xs text-slate-400">
              {formatMessage(copy.totalLabel, { count: items.length })}
            </span>
          </div>
          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              {copy.emptyState}
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {items.map((block) => {
                const nights = getRangeNights(block.startDate, block.endDate);
                return (
                  <div
                    key={block.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {block.startDate} to {block.endDate}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {block.roomName}
                        {nights
                          ? ` - ${nights} ${
                              nights === 1
                                ? copy.nights.one
                                : nights >= 2 && nights <= 4
                                  ? copy.nights.few
                                  : copy.nights.many
                            }`
                          : ""}
                        {block.reason ? ` - ${block.reason}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(block.id)}
                      disabled={deletingId === block.id}
                    >
                      {deletingId === block.id ? copy.deleting : copy.delete}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
