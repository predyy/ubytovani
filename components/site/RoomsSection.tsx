"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type RoomCard = {
  id: string;
  name: string;
  description: string;
  amenities: string[];
  images: Array<{ id: string; url: string }>;
  maxGuests: number | null;
};

type RoomsStatus =
  | { type: "idle" | "loading" }
  | { type: "error"; message: string };

export default function RoomsSection() {
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [status, setStatus] = useState<RoomsStatus>({ type: "idle" });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedRoomId = searchParams.get("room");

  useEffect(() => {
    const controller = new AbortController();

    const loadRooms = async () => {
      setStatus({ type: "loading" });
      try {
        const response = await fetch("/api/rooms", { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load rooms.");
        }
        setRooms(payload.rooms || []);
        setStatus({ type: "idle" });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setStatus({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to load rooms.",
        });
      }
    };

    loadRooms();

    return () => controller.abort();
  }, []);

  const updateRoomParam = useCallback(
    (roomId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("room", roomId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      updateRoomParam(rooms[0].id);
    }
  }, [rooms, selectedRoomId, updateRoomParam]);

  return (
    <section id="rooms" className="border-t border-slate-100 bg-white">
      <div className="container mx-auto space-y-8 px-4 py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Rooms</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              Choose your room
            </h2>
            <p className="mt-2 text-slate-600">
              Browse available room types and select the best fit for your stay.
            </p>
          </div>
        </div>

        {status.type === "error" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {status.message}
          </div>
        ) : null}

        {rooms.length === 0 && status.type !== "loading" ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No rooms are available right now.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {rooms.map((room) => {
              const imageUrl = room.images[0]?.url || null;
              const isSelected = selectedRoomId === room.id;
              return (
                <div
                  key={room.id}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                    isSelected ? "border-blue-300" : "border-slate-200"
                  }`}
                >
                  <div className="aspect-[4/3] w-full bg-slate-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={room.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-4 p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {room.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                        {room.description}
                      </p>
                    </div>
                    {room.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {room.maxGuests ? `Up to ${room.maxGuests} guests` : ""}
                      </span>
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => updateRoomParam(room.id)}
                      >
                        {isSelected ? "Selected" : "Select room"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
