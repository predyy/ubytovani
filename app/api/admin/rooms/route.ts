import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";
import { slugify } from "@/lib/tenancy/slug";

const roomSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(1),
  amenities: z.array(z.string().min(1)).optional(),
  maxGuests: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  assetIds: z.array(z.string().min(1)).optional(),
});

export async function POST(request: Request) {
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

  const property = await prisma.property.findFirst({
    where: { tenantId: context.tenant.id },
    select: { id: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const normalizedSlug = body.slug ? slugify(body.slug) : null;
  const amenities = (body.amenities ?? []).map((amenity) => amenity.trim()).filter(Boolean);
  const assetIds = body.assetIds ?? [];

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

  try {
    const room = await prisma.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          tenantId: context.tenant.id,
          propertyId: property.id,
          name: body.name.trim(),
          slug: normalizedSlug,
          description: body.description.trim(),
          amenities,
          maxGuests: body.maxGuests ?? null,
          isActive: body.isActive ?? true,
        },
      });

      if (assetIds.length > 0) {
        await tx.roomImage.createMany({
          data: assetIds.map((assetId, index) => ({
            tenantId: context.tenant.id,
            roomId: created.id,
            assetId,
            sortOrder: index,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({ room: { id: room.id } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create room." }, { status: 500 });
  }
}
