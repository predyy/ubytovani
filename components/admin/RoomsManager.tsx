"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type RoomListItem = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  amenities: string[];
  imageUrl: string | null;
};

type RoomsManagerProps = {
  lang: string;
  tenantSlug: string;
  rooms: RoomListItem[];
};

type StatusState =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

export default function RoomsManager({ lang, tenantSlug, rooms }: RoomsManagerProps) {
  const [items, setItems] = useState<RoomListItem[]>(rooms);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (roomId: string) => {
    if (deletingId) {
      return;
    }

    setDeletingId(roomId);
    setStatus({ type: "idle" });

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete room.");
      }

      setItems((prev) => prev.filter((room) => room.id !== roomId));
      setStatus({ type: "success", message: "Room deleted." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete room.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Rooms</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Rooms</h1>
            <p className="mt-2 text-slate-600">
              Manage room descriptions, amenities, and galleries.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Active tenant: {tenantSlug} | Locale: {lang.toUpperCase()}
            </p>
          </div>
          <Link
            href={`/${lang}/rooms/new`}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Create room
          </Link>
        </div>
      </div>

      <div className="container mx-auto space-y-8 px-6 py-8">
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

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No rooms yet. Create the first one to get started.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="h-24 w-32 overflow-hidden rounded-2xl bg-slate-100">
                      {room.imageUrl ? (
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {room.name}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            room.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {room.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {room.description}
                      </p>
                      {room.amenities.length > 0 ? (
                        <p className="mt-2 text-xs text-slate-400">
                          {room.amenities.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/${lang}/rooms/${room.id}/edit`}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                    >
                      Edit
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(room.id)}
                      disabled={deletingId === room.id}
                    >
                      {deletingId === room.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
