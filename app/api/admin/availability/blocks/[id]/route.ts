import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const deleted = await prisma.availabilityBlock.deleteMany({
    where: {
      id: params.id,
      tenantId: context.tenant.id,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
