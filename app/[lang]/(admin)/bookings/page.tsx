import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import BookingsManager from "@/components/admin/BookingsManager";
import { formatDateOnly, isValidDateRange, parseDateOnly } from "@/lib/dates";

type BookingsPageProps = {
  params: Promise<{
    lang: string;
  }>;
  searchParams?:
    | Promise<{ status?: string; from?: string; to?: string }>
    | { status?: string; from?: string; to?: string };
};

const statusOrder = {
  PENDING: 0,
  CONFIRMED: 1,
  CANCELLED: 2,
} as const;

export default async function BookingsPage({
  params,
  searchParams,
}: BookingsPageProps) {
  const { lang } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

  const user = await requireUser({
    lang,
    nextPath: `/${lang}/bookings`,
  });

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;

  const membership = await prisma.tenantMember.findFirst({
    where: {
      userId: user.id,
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
    },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    redirect(`/${lang}/onboarding`);
  }

  const property = await prisma.property.findFirst({
    where: { tenantId: membership.tenantId },
  });

  if (!property) {
    redirect(`/${lang}/onboarding`);
  }

  const allowedStatuses = new Set(["PENDING", "CONFIRMED", "CANCELLED"]);
  const statusFilter = allowedStatuses.has(resolvedSearchParams.status ?? "")
    ? (resolvedSearchParams.status as "PENDING" | "CONFIRMED" | "CANCELLED")
    : "";

  const fromDate = resolvedSearchParams.from
    ? parseDateOnly(resolvedSearchParams.from)
    : null;
  const toDate = resolvedSearchParams.to
    ? parseDateOnly(resolvedSearchParams.to)
    : null;

  const where: {
    tenantId: string;
    propertyId: string;
    status?: "PENDING" | "CONFIRMED" | "CANCELLED";
    checkInDate?: { lt: Date };
    checkOutDate?: { gt: Date };
    AND?: Array<{ checkInDate?: { lt: Date }; checkOutDate?: { gt: Date } }>;
  } = {
    tenantId: membership.tenantId,
    propertyId: property.id,
  };

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (fromDate && toDate && isValidDateRange(fromDate, toDate)) {
    where.AND = [
      { checkInDate: { lt: toDate } },
      { checkOutDate: { gt: fromDate } },
    ];
  } else if (fromDate) {
    where.checkOutDate = { gt: fromDate };
  } else if (toDate) {
    where.checkInDate = { lt: toDate };
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { room: true },
  });

  const sorted = reservations.slice().sort((a, b) => {
    const statusScore = statusOrder[a.status] - statusOrder[b.status];
    if (statusScore !== 0) {
      return statusScore;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <BookingsManager
      lang={lang}
      tenantSlug={membership.tenant.slug}
      autoConfirmBookings={membership.tenant.autoConfirmBookings}
      canManageSettings={["ADMIN", "OWNER"].includes(membership.role)}
      filters={{
        status: statusFilter,
        from: fromDate ? resolvedSearchParams.from ?? "" : "",
        to: toDate ? resolvedSearchParams.to ?? "" : "",
      }}
      reservations={sorted.map((reservation) => ({
        id: reservation.id,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail,
        guestPhone: reservation.guestPhone ?? null,
        guestCount: reservation.guestCount ?? null,
        message: reservation.message,
        checkInDate: formatDateOnly(reservation.checkInDate),
        checkOutDate: formatDateOnly(reservation.checkOutDate),
        status: reservation.status,
        roomName: reservation.room?.name ?? "Room",
        createdAt: reservation.createdAt.toISOString(),
      }))}
    />
  );
}
