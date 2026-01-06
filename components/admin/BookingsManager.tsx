"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMessage, getMessages } from "@/lib/i18n/messages";

type ReservationItem = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCount: number | null;
  message: string | null;
  checkInDate: string;
  checkOutDate: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  roomName: string;
  createdAt: string;
};

type BookingsManagerProps = {
  lang: string;
  tenantSlug: string;
  autoConfirmBookings: boolean;
  canManageSettings: boolean;
  reservations: ReservationItem[];
  filters: {
    status: string;
    from: string;
    to: string;
  };
};

type StatusState =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

const statusClassNames = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-600",
} as const;

export default function BookingsManager({
  lang,
  tenantSlug,
  autoConfirmBookings,
  canManageSettings,
  reservations,
  filters,
}: BookingsManagerProps) {
  const [items, setItems] = useState<ReservationItem[]>(reservations);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [autoConfirm, setAutoConfirm] = useState(autoConfirmBookings);
  const [isSavingSetting, setIsSavingSetting] = useState(false);
  const copy = getMessages(lang).admin.bookings;
  const statusLabels = copy.statusLabels;

  const emptyMessage = useMemo(() => {
    if (filters.status || filters.from || filters.to) {
      return copy.emptyFiltered;
    }
    return copy.empty;
  }, [filters, copy.empty, copy.emptyFiltered]);

  const handleConfirm = async (id: string) => {
    if (busyId) {
      return;
    }

    setBusyId(id);
    setStatus({ type: "idle" });

    try {
      const response = await fetch(`/api/admin/reservations/${id}/confirm`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.confirmError);
      }

      setItems((prev) =>
        prev.map((reservation) =>
          reservation.id === id
            ? { ...reservation, status: payload.reservation.status }
            : reservation,
        ),
      );
      setStatus({ type: "success", message: copy.confirmSuccess });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : copy.confirmError,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (busyId) {
      return;
    }

    setBusyId(id);
    setStatus({ type: "idle" });

    try {
      const response = await fetch(`/api/admin/reservations/${id}/cancel`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.cancelError);
      }

      setItems((prev) =>
        prev.map((reservation) =>
          reservation.id === id
            ? { ...reservation, status: payload.reservation.status }
            : reservation,
        ),
      );
      setStatus({ type: "success", message: copy.cancelSuccess });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : copy.cancelError,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleAutoConfirmToggle = async () => {
    if (isSavingSetting) {
      return;
    }

    if (!canManageSettings) {
      setStatus({
        type: "error",
        message: copy.settingsDenied,
      });
      return;
    }

    setIsSavingSetting(true);
    setStatus({ type: "idle" });

    try {
      const response = await fetch("/api/admin/booking-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoConfirmBookings: !autoConfirm }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.settingsError);
      }

      setAutoConfirm(payload.autoConfirmBookings);
      setStatus({ type: "success", message: copy.settingsSuccess });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : copy.settingsError,
      });
    } finally {
      setIsSavingSetting(false);
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
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {copy.policyTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {copy.policyHint}
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                checked={autoConfirm}
                onChange={handleAutoConfirmToggle}
                disabled={!canManageSettings || isSavingSetting}
              />
              {copy.autoConfirmLabel}
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {copy.filtersTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {copy.filtersHint}
              </p>
            </div>
            <form
              method="get"
              action={`/${lang}/bookings`}
              className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="status">
                  {copy.statusLabel}
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={filters.status}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <option value="">{copy.statusAll}</option>
                  <option value="PENDING">{statusLabels.PENDING}</option>
                  <option value="CONFIRMED">{statusLabels.CONFIRMED}</option>
                  <option value="CANCELLED">{statusLabels.CANCELLED}</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="from">
                  {copy.fromLabel}
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={filters.from}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="to">
                  {copy.toLabel}
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={filters.to}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  {copy.applyFilters}
                </Button>
              </div>
            </form>
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
              {copy.reservationsTitle}
            </h2>
            <span className="text-xs text-slate-400">
              {formatMessage(copy.totalLabel, { count: items.length })}
            </span>
          </div>
          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {items.map((reservation) => {
                const details = [
                  reservation.roomName,
                  reservation.guestName,
                  reservation.guestEmail,
                  reservation.guestPhone
                    ? `${copy.phoneLabel}: ${reservation.guestPhone}`
                    : null,
                  reservation.guestCount
                    ? `${copy.guestsLabel}: ${reservation.guestCount}`
                    : null,
                ].filter(Boolean);

                return (
                  <div
                    key={reservation.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {reservation.checkInDate} to {reservation.checkOutDate}
                        </p>
                        {details.length > 0 ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {details.join(" · ")}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-400">
                          {formatMessage(copy.createdLabel, {
                            date: new Date(reservation.createdAt).toLocaleString(),
                          })}
                        </p>
                      </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[reservation.status]}`}
                      >
                        {statusLabels[reservation.status]}
                      </span>
                      {reservation.status === "PENDING" ? (
                        <Button
                          type="button"
                          onClick={() => handleConfirm(reservation.id)}
                          disabled={busyId === reservation.id}
                        >
                          {busyId === reservation.id ? copy.working : copy.confirm}
                        </Button>
                      ) : null}
                      {reservation.status !== "CANCELLED" ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCancel(reservation.id)}
                          disabled={busyId === reservation.id}
                        >
                          {busyId === reservation.id ? copy.working : copy.cancel}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                    {reservation.message ? (
                      <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                          {copy.guestMessage}
                        </summary>
                        <p className="mt-2 whitespace-pre-line">{reservation.message}</p>
                      </details>
                    ) : null}
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
