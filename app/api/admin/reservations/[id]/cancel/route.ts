import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";
import { sendBookingCancelledEmails } from "@/lib/email/booking";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: params.id,
      tenantId: context.tenant.id,
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }

  if (reservation.status === "CANCELLED") {
    return NextResponse.json({
      reservation: { id: reservation.id, status: reservation.status },
    });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "CANCELLED" },
  });

  sendBookingCancelledEmails(updated.id).catch((sendError) => {
    console.error("Failed to send cancellation emails", sendError);
  });

  return NextResponse.json({
    reservation: { id: updated.id, status: updated.status },
  });
}
