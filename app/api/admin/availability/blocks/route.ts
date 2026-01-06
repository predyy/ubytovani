import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";
import { isValidDateRange, parseDateOnly, formatDateOnly } from "@/lib/dates";

const blockSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  roomId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  let body: z.infer<typeof blockSchema>;
  try {
    body = blockSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const startDate = parseDateOnly(body.startDate);
  const endDate = parseDateOnly(body.endDate);

  if (!startDate || !endDate || !isValidDateRange(startDate, endDate)) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const room = await prisma.room.findFirst({
    where: { tenantId: context.tenant.id, id: body.roomId },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const block = await prisma.availabilityBlock.create({
    data: {
      tenantId: context.tenant.id,
      propertyId: room.propertyId,
      roomId: room.id,
      startDate,
      endDate,
      reason: body.reason?.trim() || null,
    },
  });

  return NextResponse.json({
    block: {
      id: block.id,
      startDate: formatDateOnly(block.startDate),
      endDate: formatDateOnly(block.endDate),
      reason: block.reason,
      roomId: room.id,
      roomName: room.name,
      createdAt: block.createdAt.toISOString(),
    },
  });
}
