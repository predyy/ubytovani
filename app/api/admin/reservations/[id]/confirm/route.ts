import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";

class ReservationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationConflictError";
  }
}

class ReservationStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationStateError";
  }
}

class ReservationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationNotFoundError";
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const reservation = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.reservation.findFirst({
          where: {
            id: params.id,
            tenantId: context.tenant.id,
          },
        });

        if (!existing) {
          throw new ReservationNotFoundError("Reservation not found.");
        }

        if (!existing.roomId) {
          throw new ReservationStateError("Reservation missing room assignment.");
        }

        if (existing.status !== "PENDING") {
          throw new ReservationStateError("Reservation is not pending.");
        }

        const blockConflict = await tx.availabilityBlock.findFirst({
          where: {
            tenantId: context.tenant.id,
            propertyId: existing.propertyId,
            roomId: existing.roomId,
            startDate: { lt: existing.checkOutDate },
            endDate: { gt: existing.checkInDate },
          },
        });

        if (blockConflict) {
          throw new ReservationConflictError("Dates are now blocked.");
        }

        const reservationConflict = await tx.reservation.findFirst({
          where: {
            tenantId: context.tenant.id,
            propertyId: existing.propertyId,
            roomId: existing.roomId,
            status: "CONFIRMED",
            id: { not: existing.id },
            checkInDate: { lt: existing.checkOutDate },
            checkOutDate: { gt: existing.checkInDate },
          },
        });

        if (reservationConflict) {
          throw new ReservationConflictError("Dates are no longer available.");
        }

        return tx.reservation.update({
          where: { id: existing.id },
          data: { status: "CONFIRMED" },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        status: reservation.status,
      },
    });
  } catch (error) {
    if (error instanceof ReservationConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ReservationStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
