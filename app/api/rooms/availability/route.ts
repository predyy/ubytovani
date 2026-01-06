import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { isValidDateRange, parseDateOnly } from "@/lib/dates";
import { resolvePublicTenant } from "@/lib/tenancy/public-tenant";

const querySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

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
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        include: { asset: { select: { url: true } } },
      },
    },
  });

  if (rooms.length === 0) {
    return NextResponse.json({ rooms: [] });
  }

  const roomIds = rooms.map((room) => room.id);
  const roomsByProperty = new Map<string, string[]>();
  rooms.forEach((room) => {
    const roomsForProperty = roomsByProperty.get(room.propertyId) ?? [];
    roomsForProperty.push(room.id);
    roomsByProperty.set(room.propertyId, roomsForProperty);
  });

  const [blockedByBlocks, blockedByReservations] = await Promise.all([
    prisma.availabilityBlock.findMany({
      where: {
        tenantId: tenant.tenantId,
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
        OR: [{ roomId: { in: roomIds } }, { roomId: null }],
      },
      select: { roomId: true, propertyId: true },
    }),
    prisma.reservation.findMany({
      where: {
        tenantId: tenant.tenantId,
        status: "CONFIRMED",
        checkInDate: { lt: toDate },
        checkOutDate: { gt: fromDate },
        OR: [{ roomId: { in: roomIds } }, { roomId: null }],
      },
      select: { roomId: true, propertyId: true },
    }),
  ]);

  const allConflicts = [...blockedByBlocks, ...blockedByReservations];
  const blockedRoomIds = new Set<string>();
  allConflicts.forEach((conflict) => {
    if (conflict.roomId) {
      blockedRoomIds.add(conflict.roomId);
      return;
    }
    const propertyRooms = roomsByProperty.get(conflict.propertyId) ?? [];
    propertyRooms.forEach((roomId) => blockedRoomIds.add(roomId));
  });

  const availableRooms = rooms.filter((room) => !blockedRoomIds.has(room.id));

  return NextResponse.json({
    rooms: availableRooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      amenities: room.amenities,
      maxGuests: room.maxGuests,
      images: room.images.map((image) => ({
        id: image.id,
        url: image.asset.url,
      })),
    })),
  });
}
