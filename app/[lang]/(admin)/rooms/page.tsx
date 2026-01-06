import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import RoomsManager from "@/components/admin/RoomsManager";

type RoomsPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function RoomsPage({ params }: RoomsPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/rooms`,
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

  const rooms = await prisma.room.findMany({
    where: { tenantId: membership.tenantId },
    orderBy: { createdAt: "asc" },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        include: { asset: { select: { url: true } } },
      },
    },
  });

  return (
    <RoomsManager
      lang={lang}
      tenantSlug={membership.tenant.slug}
      rooms={rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        isActive: room.isActive,
        amenities: room.amenities,
        imageUrl: room.images[0]?.asset.url ?? null,
      }))}
    />
  );
}
