"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { isValidDateRange, parseDateOnly } from "@/lib/dates";
import { useBookingSelection } from "@/components/site/BookingSelectionContext";

type BookingStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type RoomsStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type BookingFormState = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: string;
  message: string;
  company: string;
};

type RoomOption = {
  id: string;
  name: string;
  description: string;
  amenities: string[];
  maxGuests: number | null;
  images: Array<{ id: string; url: string }>;
};

const initialFormState: BookingFormState = {
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  guestCount: "",
  message: "",
  company: "",
};

export default function BookingRequestForm() {
  const [form, setForm] = useState<BookingFormState>(initialFormState);
  const [status, setStatus] = useState<BookingStatus>({ type: "idle" });
  const [roomsStatus, setRoomsStatus] = useState<RoomsStatus>({ type: "idle" });
  const [availableRooms, setAvailableRooms] = useState<RoomOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const selectedRoomIdRef = useRef(selectedRoomId);
  const lastRangeRef = useRef<{ checkInDate: string; checkOutDate: string } | null>(
    null,
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selection, setSelection, resetSelection } = useBookingSelection();

  const checkInDate = selection.checkInDate ?? "";
  const checkOutDate = selection.checkOutDate ?? "";

  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) ?? null,
    [availableRooms, selectedRoomId],
  );

  const updateRoomParam = useCallback(
    (roomId: string) => {
      const params = new URLSearchParams(window.location.search);
      if (roomId) {
        params.set("room", roomId);
      } else {
        params.delete("room");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setSelection((prev) => {
      if (name === "checkInDate") {
        const nextCheckIn = value || null;
        const nextCheckOut =
          nextCheckIn && prev.checkOutDate && prev.checkOutDate > nextCheckIn
            ? prev.checkOutDate
            : null;
        return { checkInDate: nextCheckIn, checkOutDate: nextCheckOut };
      }

      if (name === "checkOutDate") {
        return {
          checkInDate: prev.checkInDate,
          checkOutDate: value || null,
        };
      }

      return prev;
    });

    setRoomsStatus({ type: "idle" });
    setAvailableRooms([]);
    setSelectedRoomId("");
    updateRoomParam("");
  };

  useEffect(() => {
    setStatus({ type: "idle" });
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    const checkIn = parseDateOnly(checkInDate);
    const checkOut = parseDateOnly(checkOutDate);

    if (!checkIn || !checkOut || !isValidDateRange(checkIn, checkOut)) {
      setRoomsStatus({ type: "idle" });
      setAvailableRooms([]);
      setSelectedRoomId("");
      updateRoomParam("");
      lastRangeRef.current = null;
      return;
    }

    if (
      lastRangeRef.current?.checkInDate === checkInDate &&
      lastRangeRef.current?.checkOutDate === checkOutDate
    ) {
      return;
    }

    const controller = new AbortController();

    const loadAvailableRooms = async () => {
      setAvailableRooms([]);
      if (selectedRoomIdRef.current) {
        setSelectedRoomId("");
      }
      setRoomsStatus({ type: "loading" });

      try {
        const query = new URLSearchParams({
          from: checkInDate,
          to: checkOutDate,
        });
        const response = await fetch(`/api/rooms/availability?${query.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load available rooms.");
        }

        const rooms = (payload.rooms || []) as RoomOption[];
        setAvailableRooms(rooms);

        if (rooms.length === 0) {
          setSelectedRoomId("");
          updateRoomParam("");
          setRoomsStatus({
            type: "error",
            message: "No rooms are available for these dates.",
          });
          return;
        }

        const paramRoom = new URLSearchParams(window.location.search).get("room");
        const preferredRoom =
          rooms.find((room) => room.id === selectedRoomIdRef.current) ??
          rooms.find((room) => room.id === paramRoom) ??
          rooms[0];

        if (preferredRoom.id !== selectedRoomId) {
          setSelectedRoomId(preferredRoom.id);
        }
        updateRoomParam(preferredRoom.id);
        setRoomsStatus({
          type: "success",
          message: `${rooms.length} room${rooms.length === 1 ? "" : "s"} available.`,
        });
        lastRangeRef.current = { checkInDate, checkOutDate };
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRoomsStatus({
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to load available rooms.",
        });
      }
    };

    loadAvailableRooms();

    return () => controller.abort();
  }, [checkInDate, checkOutDate, updateRoomParam]);

  useEffect(() => {
    if (availableRooms.length === 0) {
      return;
    }

    const paramRoom = searchParams.get("room");
    if (!paramRoom) {
      return;
    }

    if (paramRoom !== selectedRoomId) {
      const match = availableRooms.find((room) => room.id === paramRoom);
      if (match) {
        setSelectedRoomId(match.id);
      }
    }
  }, [availableRooms, searchParams, selectedRoomId]);

  const handleRoomChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedRoomId(value);
    updateRoomParam(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status.type === "loading") {
      return;
    }

    const checkIn = parseDateOnly(checkInDate);
    const checkOut = parseDateOnly(checkOutDate);

    if (!checkIn || !checkOut || !isValidDateRange(checkIn, checkOut)) {
      setStatus({ type: "error", message: "Please select valid dates." });
      return;
    }

    if (!selectedRoomId) {
      setStatus({ type: "error", message: "Please select a room." });
      return;
    }

    if (!form.guestName.trim() || !form.guestEmail.trim()) {
      setStatus({ type: "error", message: "Name and email are required." });
      return;
    }

    const guestCountValue = form.guestCount.trim();
    let guestCountNumber: number | undefined;
    if (guestCountValue) {
      const parsedCount = Number(guestCountValue);
      if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
        setStatus({ type: "error", message: "Enter a valid guest count." });
        return;
      }
      if (selectedRoom?.maxGuests && parsedCount > selectedRoom.maxGuests) {
        setStatus({
          type: "error",
          message: `Guest count exceeds ${selectedRoom.maxGuests} for this room.`,
        });
        return;
      }
      guestCountNumber = parsedCount;
    }

    setStatus({ type: "loading" });

    try {
      const response = await fetch("/api/booking-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInDate,
          checkOutDate,
          roomId: selectedRoomId,
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone.trim() || undefined,
          guestCount: guestCountNumber,
          message: form.message,
          company: form.company,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Booking request failed.");
      }

      setForm(initialFormState);
      setAvailableRooms([]);
      setSelectedRoomId("");
      resetSelection();
      updateRoomParam("");
      setRoomsStatus({ type: "idle" });
      setStatus({
        type: "success",
        message: "Request sent. We will confirm availability shortly.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Booking request failed.",
      });
    }
  };

  const canSelectRooms = useMemo(() => {
    const checkIn = parseDateOnly(checkInDate);
    const checkOut = parseDateOnly(checkOutDate);
    return Boolean(checkIn && checkOut && isValidDateRange(checkIn, checkOut));
  }, [checkInDate, checkOutDate]);

  const canShowGuestFields = Boolean(selectedRoomId);

  return (
    <section id="booking" className="border-t border-slate-100 bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Booking request
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              Send a booking request
            </h2>
            <p className="mt-2 text-slate-600">
              Choose your dates, select a room, then complete your details.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Selected room
              </p>
              {selectedRoom ? (
                <div className="mt-4 space-y-4">
                  {selectedRoom.images[0] ? (
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
                      <img
                        src={selectedRoom.images[0].url}
                        alt={selectedRoom.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selectedRoom.name}
                    </h3>
                    {selectedRoom.description ? (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-4">
                        {selectedRoom.description}
                      </p>
                    ) : null}
                  </div>
                  {selectedRoom.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRoom.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {selectedRoom.maxGuests ? (
                    <p className="text-xs text-slate-500">
                      Up to {selectedRoom.maxGuests} guests
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Select your dates and a room to preview it here.
                </p>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="checkInDate">
                    Check-in
                  </label>
                  <input
                    id="checkInDate"
                    name="checkInDate"
                    type="date"
                    value={checkInDate}
                    onChange={handleDateChange}
                    required
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="checkOutDate">
                    Check-out
                  </label>
                  <input
                    id="checkOutDate"
                    name="checkOutDate"
                    type="date"
                    value={checkOutDate}
                    onChange={handleDateChange}
                    min={checkInDate || undefined}
                    required
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {canSelectRooms ? (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="roomId">
                      Available rooms
                    </label>
                    <select
                      id="roomId"
                      name="roomId"
                      value={selectedRoomId}
                      onChange={handleRoomChange}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      disabled={
                        roomsStatus.type === "loading" || availableRooms.length === 0
                      }
                    >
                      {availableRooms.length === 0 ? (
                        <option value="">
                          {roomsStatus.type === "loading"
                            ? "Checking rooms..."
                            : "No rooms available"}
                        </option>
                      ) : (
                        availableRooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                            {room.maxGuests ? ` (up to ${room.maxGuests} guests)` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {roomsStatus.type === "error" ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {roomsStatus.message}
                    </div>
                  ) : null}

                  {roomsStatus.type === "success" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {roomsStatus.message}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {canShowGuestFields ? (
                <>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="guestName">
                      Full name
                    </label>
                    <input
                      id="guestName"
                      name="guestName"
                      value={form.guestName}
                      onChange={handleFormChange}
                      required
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="guestEmail">
                      Email address
                    </label>
                    <input
                      id="guestEmail"
                      name="guestEmail"
                      type="email"
                      value={form.guestEmail}
                      onChange={handleFormChange}
                      required
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="guestPhone">
                      Phone
                    </label>
                    <input
                      id="guestPhone"
                      name="guestPhone"
                      type="tel"
                      value={form.guestPhone}
                      onChange={handleFormChange}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="+420 555 123 456"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="guestCount">
                      Number of guests
                    </label>
                    <input
                      id="guestCount"
                      name="guestCount"
                      type="number"
                      min={1}
                      max={selectedRoom?.maxGuests ?? undefined}
                      value={form.guestCount}
                      onChange={handleFormChange}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="2"
                    />
                    {selectedRoom?.maxGuests ? (
                      <p className="text-xs text-slate-400">
                        Max guests for this room: {selectedRoom.maxGuests}.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="message">
                      Note (optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleFormChange}
                      rows={4}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="Share any details or special requests."
                    />
                  </div>

                  <div
                    className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="company">Company</label>
                    <input
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleFormChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <Button type="submit" disabled={status.type === "loading"}>
                    {status.type === "loading" ? "Sending..." : "Send request"}
                  </Button>

                  {status.type === "error" ? (
                    <div
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      role="alert"
                    >
                      {status.message}
                    </div>
                  ) : null}

                  {status.type === "success" ? (
                    <div
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                      role="status"
                      aria-live="polite"
                    >
                      {status.message}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
