import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolvePublicTenant } from "@/lib/tenancy/public-tenant";

export async function GET(request: Request) {
  const tenant = await resolvePublicTenant(request);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not resolved." }, { status: 400 });
  }

  const rooms = await prisma.room.findMany({
    where: {
      tenantId: tenant.tenantId,
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        include: { asset: { select: { url: true } } },
      },
    },
  });

  return NextResponse.json({
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      slug: room.slug,
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
