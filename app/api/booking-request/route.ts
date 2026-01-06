import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isValidDateRange, parseDateOnly } from "@/lib/dates";
import { resolvePublicTenant } from "@/lib/tenancy/public-tenant";
import { getClientIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";

const bookingSchema = z.object({
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  roomId: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(1).max(50).optional(),
  guestCount: z.number().int().positive().optional(),
  message: z.string().max(2000).optional(),
  company: z.string().optional(),
});

class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

const bookingRateLimit = {
  windowMs: 60 * 60 * 1000,
  max: 5,
};

export async function POST(request: Request) {
  let body: z.infer<typeof bookingSchema>;

  try {
    body = bookingSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (body.company && body.company.trim().length > 0) {
    return NextResponse.json({ error: "Request blocked." }, { status: 400 });
  }

  const checkInDate = parseDateOnly(body.checkInDate);
  const checkOutDate = parseDateOnly(body.checkOutDate);

  if (!checkInDate || !checkOutDate || !isValidDateRange(checkInDate, checkOutDate)) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const tenant = await resolvePublicTenant(request);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not resolved." }, { status: 400 });
  }

  const [tenantRecord, room] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenant.tenantId },
      select: { autoConfirmBookings: true },
    }),
    prisma.room.findFirst({
      where: {
        tenantId: tenant.tenantId,
        id: body.roomId,
        isActive: true,
      },
      select: { id: true, propertyId: true },
    }),
  ]);

  if (!tenantRecord) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const ip = getClientIp(request);
  const rateLimitKey = `${tenant.tenantId}:${ip}:booking-request`;
  const rateLimit = checkRateLimit(rateLimitKey, bookingRateLimit);

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
    if (rateLimit.retryAfter) {
      response.headers.set("Retry-After", String(rateLimit.retryAfter));
    }
    return response;
  }

  try {
    const reservation = await prisma.$transaction(
      async (tx) => {
        const blockConflict = await tx.availabilityBlock.findFirst({
          where: {
            tenantId: tenant.tenantId,
            propertyId: room.propertyId,
            roomId: room.id,
            startDate: { lt: checkOutDate },
            endDate: { gt: checkInDate },
          },
        });

        if (blockConflict) {
          throw new BookingConflictError("Requested dates are not available.");
        }

        const reservationConflict = await tx.reservation.findFirst({
          where: {
            tenantId: tenant.tenantId,
            propertyId: room.propertyId,
            roomId: room.id,
            status: "CONFIRMED",
            checkInDate: { lt: checkOutDate },
            checkOutDate: { gt: checkInDate },
          },
        });

        if (reservationConflict) {
          throw new BookingConflictError("Requested dates are not available.");
        }

        return tx.reservation.create({
          data: {
            tenantId: tenant.tenantId,
            propertyId: room.propertyId,
            roomId: room.id,
            guestName: body.guestName,
            guestEmail: body.guestEmail,
            guestPhone: body.guestPhone?.trim() || null,
            guestCount: body.guestCount ?? null,
            message: body.message?.trim() || null,
            checkInDate,
            checkOutDate,
            status: tenantRecord.autoConfirmBookings ? "CONFIRMED" : "PENDING",
            source: "DIRECT",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json({
      id: reservation.id,
      status: reservation.status,
    });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    throw error;
  }
}
