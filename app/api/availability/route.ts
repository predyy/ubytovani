import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  addDays,
  formatDateOnly,
  isValidDateRange,
  parseDateOnly,
} from "@/lib/dates";
import { resolvePublicTenant } from "@/lib/tenancy/public-tenant";

const querySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

function addRangeToSet(set: Set<string>, startDate: Date, endDate: Date) {
  let cursor = startDate;
  while (cursor < endDate) {
    set.add(formatDateOnly(cursor));
    cursor = addDays(cursor, 1);
  }
}

function buildDateRange(fromDate: Date, toDate: Date) {
  const dates: string[] = [];
  let cursor = fromDate;
  while (cursor < toDate) {
    dates.push(formatDateOnly(cursor));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const fromDate = parseDateOnly(parsed.data.from);
  const toDate = parseDateOnly(parsed.data.to);

  if (!fromDate || !toDate || !isValidDateRange(fromDate, toDate)) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const tenant = await resolvePublicTenant(request);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not resolved." }, { status: 400 });
  }

  const rooms = await prisma.room.findMany({
    where: { tenantId: tenant.tenantId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, propertyId: true },
  });

  if (rooms.length === 0) {
    return NextResponse.json({
      from: formatDateOnly(fromDate),
      to: formatDateOnly(toDate),
      unavailableDates: buildDateRange(fromDate, toDate),
    });
  }

  const roomIds = rooms.map((room) => room.id);
  const roomsByProperty = new Map<string, string[]>();
  rooms.forEach((room) => {
    const roomsForProperty = roomsByProperty.get(room.propertyId) ?? [];
    roomsForProperty.push(room.id);
    roomsByProperty.set(room.propertyId, roomsForProperty);
  });

  const [blocks, reservations] = await Promise.all([
    prisma.availabilityBlock.findMany({
      where: {
        tenantId: tenant.tenantId,
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
        OR: [{ roomId: { in: roomIds } }, { roomId: null }],
      },
      orderBy: { startDate: "asc" },
      select: {
        roomId: true,
        propertyId: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.reservation.findMany({
      where: {
        tenantId: tenant.tenantId,
        status: "CONFIRMED",
        checkInDate: { lt: toDate },
        checkOutDate: { gt: fromDate },
        OR: [{ roomId: { in: roomIds } }, { roomId: null }],
      },
      orderBy: { checkInDate: "asc" },
      select: {
        roomId: true,
        propertyId: true,
        checkInDate: true,
        checkOutDate: true,
      },
    }),
  ]);

  const blockedByRoom = new Map<string, Set<string>>();
  roomIds.forEach((roomId) => blockedByRoom.set(roomId, new Set()));

  blocks.forEach((block) => {
    const targetRoomIds = block.roomId
      ? [block.roomId]
      : roomsByProperty.get(block.propertyId) ?? [];
    targetRoomIds.forEach((roomId) => {
      const set = blockedByRoom.get(roomId);
      if (set) {
        addRangeToSet(set, block.startDate, block.endDate);
      }
    });
  });

  reservations.forEach((reservation) => {
    const targetRoomIds = reservation.roomId
      ? [reservation.roomId]
      : roomsByProperty.get(reservation.propertyId) ?? [];
    targetRoomIds.forEach((roomId) => {
      const set = blockedByRoom.get(roomId);
      if (set) {
        addRangeToSet(set, reservation.checkInDate, reservation.checkOutDate);
      }
    });
  });

  const unavailableDates: string[] = [];
  let cursor = fromDate;
  while (cursor < toDate) {
    const dateString = formatDateOnly(cursor);
    const hasAvailability = roomIds.some((roomId) => {
      const blockedSet = blockedByRoom.get(roomId);
      return !blockedSet?.has(dateString);
    });
    if (!hasAvailability) {
      unavailableDates.push(dateString);
    }
    cursor = addDays(cursor, 1);
  }

  return NextResponse.json({
    from: formatDateOnly(fromDate),
    to: formatDateOnly(toDate),
    unavailableDates,
  });
}
