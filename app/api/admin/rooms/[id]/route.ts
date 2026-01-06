import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";
import { slugify } from "@/lib/tenancy/slug";

const roomSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional().nullable(),
  description: z.string().min(1).optional(),
  amenities: z.array(z.string().min(1)).optional(),
  maxGuests: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  assetIds: z.array(z.string().min(1)).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  let body: z.infer<typeof roomSchema>;
  try {
    body = roomSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const room = await prisma.room.findFirst({
    where: { id: params.id, tenantId: context.tenant.id },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const normalizedSlug =
    body.slug === undefined ? undefined : body.slug ? slugify(body.slug) : null;
  const amenities = body.amenities
    ? body.amenities.map((amenity) => amenity.trim()).filter(Boolean)
    : undefined;
  const assetIds = body.assetIds ?? [];

  if (body.assetIds) {
    const assets = assetIds.length
      ? await prisma.asset.findMany({
          where: { tenantId: context.tenant.id, id: { in: assetIds } },
          select: { id: true },
        })
      : [];

    const assetIdSet = new Set(assets.map((asset) => asset.id));
    if (assetIds.some((assetId) => !assetIdSet.has(assetId))) {
      return NextResponse.json({ error: "One or more assets are invalid." }, { status: 400 });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.room.update({
        where: { id: room.id },
        data: {
          name: body.name ? body.name.trim() : undefined,
          slug: normalizedSlug,
          description: body.description ? body.description.trim() : undefined,
          amenities,
          maxGuests: body.maxGuests === undefined ? undefined : body.maxGuests,
          isActive: body.isActive,
        },
      });

      if (body.assetIds) {
        await tx.roomImage.deleteMany({
          where: { roomId: room.id },
        });
        if (assetIds.length > 0) {
          await tx.roomImage.createMany({
            data: assetIds.map((assetId, index) => ({
              tenantId: context.tenant.id,
              roomId: room.id,
              assetId,
              sortOrder: index,
            })),
          });
        }
      }
    });

    return NextResponse.json({ room: { id: room.id } });
  } catch {
    return NextResponse.json({ error: "Failed to update room." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const totalRooms = await prisma.room.count({
    where: { tenantId: context.tenant.id },
  });

  if (totalRooms <= 1) {
    return NextResponse.json({ error: "You must keep at least one room." }, { status: 400 });
  }

  const deleted = await prisma.room.deleteMany({
    where: { id: params.id, tenantId: context.tenant.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
