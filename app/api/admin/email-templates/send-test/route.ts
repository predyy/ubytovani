import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";
import {
  buildBookingEmailContext,
  buildSampleEmailContext,
} from "@/lib/email/context";
import { sendTenantEmail } from "@/lib/email/service";

const bodySchema = z.object({
  type: z.enum([
    "BOOKING_REQUEST_GUEST",
    "BOOKING_REQUEST_HOST",
    "BOOKING_CONFIRMED_GUEST",
    "BOOKING_CONFIRMED_HOST",
    "BOOKING_CANCELLED_GUEST",
    "BOOKING_CANCELLED_HOST",
  ]),
  locale: z.string().min(1),
  toEmail: z.string().email(),
});

export async function POST(request: Request) {
  const context = await requireAdminTenant("ADMIN");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  let body: z.infer<typeof bodySchema>;

  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: context.tenant.id },
    select: { id: true, name: true, slug: true, defaultLocale: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const latestReservation = await prisma.reservation.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const contextData = latestReservation
    ? await buildBookingEmailContext(latestReservation.id)
    : null;

  const templateContext =
    contextData?.context ??
    buildSampleEmailContext({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      defaultLocale: body.locale || tenant.defaultLocale,
    });

  const result = await sendTenantEmail({
    tenantId: tenant.id,
    type: body.type,
    locale: body.locale,
    toEmail: body.toEmail,
    context: templateContext,
    reservationId: null,
    ignoreEnabled: true,
  });

  if (result.status !== "sent") {
    return NextResponse.json(
      { error: result.error || "Failed to send test email." },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: result.status });
}
