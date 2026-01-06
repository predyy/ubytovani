import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";

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
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
  textBody: z.string().optional(),
  enabled: z.boolean(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional().or(z.literal("")),
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

  const template = await prisma.emailTemplate.upsert({
    where: {
      tenantId_type_locale: {
        tenantId: context.tenant.id,
        type: body.type,
        locale: body.locale,
      },
    },
    update: {
      subject: body.subject.trim(),
      htmlBody: body.htmlBody.trim(),
      textBody: body.textBody?.trim() || null,
      enabled: body.enabled,
      fromName: body.fromName?.trim() || null,
      replyTo: body.replyTo?.trim() || null,
    },
    create: {
      tenantId: context.tenant.id,
      type: body.type,
      locale: body.locale,
      subject: body.subject.trim(),
      htmlBody: body.htmlBody.trim(),
      textBody: body.textBody?.trim() || null,
      enabled: body.enabled,
      fromName: body.fromName?.trim() || null,
      replyTo: body.replyTo?.trim() || null,
    },
  });

  return NextResponse.json({
    template: {
      id: template.id,
      type: template.type,
      locale: template.locale,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      enabled: template.enabled,
      fromName: template.fromName,
      replyTo: template.replyTo,
      updatedAt: template.updatedAt.toISOString(),
    },
  });
}
