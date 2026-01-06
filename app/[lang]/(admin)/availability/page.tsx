import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import AvailabilityManager from "@/components/admin/AvailabilityManager";
import { addDays, formatDateOnly, getUtcToday } from "@/lib/dates";

type AvailabilityPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function AvailabilityPage({ params }: AvailabilityPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/availability`,
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
  });

  if (rooms.length === 0) {
    redirect(`/${lang}/rooms/new`);
  }

  const today = getUtcToday();
  const windowEnd = addDays(today, 90);

  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      tenantId: membership.tenantId,
      startDate: { lt: windowEnd },
      endDate: { gt: today },
    },
    orderBy: { startDate: "asc" },
    include: { room: true },
  });

  return (
    <AvailabilityManager
      lang={lang}
      tenantSlug={membership.tenant.slug}
      rooms={rooms.map((room) => ({
        id: room.id,
        name: room.name,
        isActive: room.isActive,
      }))}
      blocks={blocks.map((block) => ({
        id: block.id,
        startDate: formatDateOnly(block.startDate),
        endDate: formatDateOnly(block.endDate),
        reason: block.reason,
        roomId: block.roomId,
        roomName: block.room?.name ?? "Room",
        createdAt: block.createdAt.toISOString(),
      }))}
    />
  );
}
