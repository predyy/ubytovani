"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addDays,
  formatDateOnly,
  getDaysInUtcMonth,
  getUtcToday,
  parseDateOnly,
  startOfUtcMonth,
} from "@/lib/dates";
import { useBookingSelection } from "@/components/site/BookingSelectionContext";

type AvailabilityState =
  | { type: "idle" | "loading" }
  | { type: "error"; message: string };

type MonthCell = {
  day: number;
  date: string;
  isAvailable: boolean;
  isToday: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildMonthCells(
  monthStart: Date,
  unavailableDates: Set<string>,
  todayString: string,
) {
  const cells: Array<MonthCell | null> = [];
  const firstDay = startOfUtcMonth(monthStart);
  const startWeekday = firstDay.getUTCDay();
  const daysInMonth = getDaysInUtcMonth(monthStart);

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day),
    );
    const dateString = formatDateOnly(date);
    cells.push({
      day,
      date: dateString,
      isAvailable: !unavailableDates.has(dateString),
      isToday: dateString === todayString,
    });
  }

  return cells;
}

export default function AvailabilitySection() {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [status, setStatus] = useState<AvailabilityState>({ type: "idle" });
  const { selection, setSelection } = useBookingSelection();

  const { monthStarts, from, to, todayString } = useMemo(() => {
    const today = getUtcToday();
    const firstMonth = startOfUtcMonth(today);
    const secondMonth = startOfUtcMonth(
      addDays(firstMonth, getDaysInUtcMonth(firstMonth)),
    );
    const endOfSecondMonth = addDays(
      secondMonth,
      getDaysInUtcMonth(secondMonth),
    );

    return {
      monthStarts: [firstMonth, secondMonth],
      from: formatDateOnly(firstMonth),
      to: formatDateOnly(endOfSecondMonth),
      todayString: formatDateOnly(today),
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadAvailability = async () => {
      setStatus({ type: "loading" });

      try {
        const query = new URLSearchParams({ from, to });
        const response = await fetch(`/api/availability?${query.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load availability.");
        }

        setUnavailableDates(payload.unavailableDates || []);
        setStatus({ type: "idle" });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStatus({
          type: "error",
          message:
            error instanceof Error ? error.message : "Unable to load availability.",
        });
      }
    };

    loadAvailability();

    return () => controller.abort();
  }, [from, to]);

  const unavailableSet = useMemo(
    () => new Set(unavailableDates),
    [unavailableDates],
  );

  const selectionStart = selection.checkInDate;
  const selectionEnd = selection.checkOutDate;
  const hasSelection = Boolean(selectionStart);

  const handleDateClick = (date: string, isAvailable: boolean) => {
    if (!isAvailable) {
      return;
    }

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelection({ checkInDate: date, checkOutDate: null });
      return;
    }

    if (selectionStart && !selectionEnd) {
      if (date <= selectionStart) {
        setSelection({ checkInDate: date, checkOutDate: null });
        return;
      }
      setSelection({ checkInDate: selectionStart, checkOutDate: date });
    }
  };

  const isInSelectedRange = (date: string) => {
    if (!selectionStart) {
      return false;
    }
    if (!selectionEnd) {
      return date === selectionStart;
    }
    return date >= selectionStart && date <= selectionEnd;
  };

  const isValidSelection =
    selectionStart &&
    selectionEnd &&
    (() => {
      const start = parseDateOnly(selectionStart);
      const end = parseDateOnly(selectionEnd);
      return Boolean(start && end && start < end);
    })();

  return (
    <section id="availability" className="border-t border-slate-100 bg-slate-50">
      <div className="container mx-auto space-y-8 px-4 py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Availability
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              Check open dates
            </h2>
            <p className="mt-2 text-slate-600">
              Green dates have at least one room available.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-slate-500 md:items-end">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-200" />
                Any room available
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                Fully booked
              </div>
            </div>
            {hasSelection && !isValidSelection ? (
              <span className="text-xs text-slate-400">
                Select a check-out date after your check-in.
              </span>
            ) : null}
          </div>
        </div>

        {status.type === "error" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {status.message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          {monthStarts.map((monthStart) => {
            const label = monthStart.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            });
            const cells = buildMonthCells(
              monthStart,
              unavailableSet,
              todayString,
            );

            return (
              <div
                key={label}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
                  {status.type === "loading" ? (
                    <span className="text-xs text-slate-400">Loading...</span>
                  ) : null}
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-400">
                  {weekdays.map((day) => (
                    <div key={day} className="text-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {cells.map((cell, index) => {
                    if (!cell) {
                      return <div key={`empty-${index}`} />;
                    }

                    const baseClasses =
                      "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition";
                    const availabilityClasses = cell.isAvailable
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-200 text-slate-500";
                    const todayClasses = cell.isToday ? "ring-2 ring-blue-400" : "";
                    const selectionClasses = isInSelectedRange(cell.date)
                      ? "ring-2 ring-blue-500"
                      : "";
                    const selectionStrongClasses =
                      cell.date === selectionStart || cell.date === selectionEnd
                        ? "font-semibold ring-blue-700"
                        : "";
                    const disabledClasses = cell.isAvailable
                      ? "cursor-pointer hover:bg-emerald-200"
                      : "cursor-not-allowed";

                    return (
                      <button
                        key={cell.date}
                        type="button"
                        onClick={() => handleDateClick(cell.date, cell.isAvailable)}
                        disabled={!cell.isAvailable}
                        className={`${baseClasses} ${availabilityClasses} ${todayClasses} ${selectionClasses} ${selectionStrongClasses} ${disabledClasses}`}
                        aria-label={cell.date}
                        aria-pressed={isInSelectedRange(cell.date)}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
