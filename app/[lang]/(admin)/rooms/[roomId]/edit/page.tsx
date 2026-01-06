import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import RoomForm from "@/components/admin/RoomForm";

type RoomEditPageProps = {
  params: Promise<{
    lang: string;
    roomId: string;
  }>;
};

export default async function RoomEditPage({ params }: RoomEditPageProps) {
  const { lang, roomId } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/rooms/${roomId}/edit`,
  });

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;

  const membership = await prisma.tenantMember.findFirst({
    where: {
      userId: user.id,
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
    },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    redirect(`/${lang}/onboarding`);
  }

  const room = await prisma.room.findFirst({
    where: { id: roomId, tenantId: membership.tenantId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!room) {
    notFound();
  }

  const assets = await prisma.asset.findMany({
    where: { tenantId: membership.tenantId },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <RoomForm
      lang={lang}
      tenantSlug={membership.tenant.slug}
      mode="edit"
      assets={assets.map((asset) => ({
        id: asset.id,
        url: asset.url,
        originalName: asset.originalName,
      }))}
      initialRoom={{
        id: room.id,
        name: room.name,
        slug: room.slug ?? "",
        description: room.description,
        amenities: room.amenities,
        maxGuests: room.maxGuests,
        isActive: room.isActive,
        assetIds: room.images.map((image) => image.assetId),
      }}
    />
  );
}
