import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";

export async function GET(request: Request) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const url = new URL(request.url);
  const reservationId = url.searchParams.get("reservationId");

  const logs = await prisma.emailLog.findMany({
    where: {
      tenantId: context.tenant.id,
      ...(reservationId ? { reservationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      type: log.type,
      locale: log.locale,
      toEmail: log.toEmail,
      fromEmail: log.fromEmail,
      subject: log.subject,
      status: log.status,
      providerMessageId: log.providerMessageId,
      error: log.error,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}
