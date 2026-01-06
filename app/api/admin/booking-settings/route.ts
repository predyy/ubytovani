import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";

const settingsSchema = z.object({
  autoConfirmBookings: z.boolean(),
});

export async function POST(request: Request) {
  const context = await requireAdminTenant("ADMIN");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  let body: z.infer<typeof settingsSchema>;
  try {
    body = settingsSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const tenant = await prisma.tenant.update({
    where: { id: context.tenant.id },
    data: { autoConfirmBookings: body.autoConfirmBookings },
    select: { autoConfirmBookings: true },
  });

  return NextResponse.json({ autoConfirmBookings: tenant.autoConfirmBookings });
}
