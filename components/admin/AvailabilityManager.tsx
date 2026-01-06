"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isValidDateRange, parseDateOnly } from "@/lib/dates";

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
      setStatus({ type: "error", message: "Please select a room." });
      return;
    }

    if (!startDate || !endDate || !isValidDateRange(startDate, endDate)) {
      setStatus({ type: "error", message: "Please select a valid date range." });
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
        throw new Error(payload.error || "Failed to create block.");
      }

      const newBlock = payload.block as AvailabilityBlockItem;
      setItems((prev) => [newBlock, ...prev]);
      setForm((prev) => ({
        ...initialFormState,
        roomId: prev.roomId,
      }));
      setStatus({ type: "success", message: "Block created." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create block.",
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
        throw new Error(payload.error || "Failed to delete block.");
      }

      setItems((prev) => prev.filter((block) => block.id !== blockId));
      setStatus({ type: "success", message: "Block deleted." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete block.",
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
            Availability
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Availability blocks
          </h1>
          <p className="mt-2 text-slate-600">
            Block dates to prevent new bookings on those nights.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Active tenant: {tenantSlug} | Locale: {lang.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="container mx-auto space-y-8 px-6 py-8">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create a manual block
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Blocks are date ranges where check-ins are not allowed.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="roomId">
                  Room
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
                      {room.isActive ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="startDate">
                  Start date
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
                  End date
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
                  Reason (optional)
                </label>
                <input
                  id="reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Owner stay"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
            </div>
            <Button type="button" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create block"}
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
              Upcoming blocks
            </h2>
            <span className="text-xs text-slate-400">{items.length} total</span>
          </div>
          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No availability blocks yet.
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
                        {nights ? ` - ${nights} night${nights === 1 ? "" : "s"}` : ""}
                        {block.reason ? ` - ${block.reason}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(block.id)}
                      disabled={deletingId === block.id}
                    >
                      {deletingId === block.id ? "Deleting..." : "Delete"}
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
