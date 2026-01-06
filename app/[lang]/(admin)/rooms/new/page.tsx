import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import RoomForm from "@/components/admin/RoomForm";

type RoomNewPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function RoomNewPage({ params }: RoomNewPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/rooms/new`,
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

  const assets = await prisma.asset.findMany({
    where: { tenantId: membership.tenantId },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <RoomForm
      lang={lang}
      tenantSlug={membership.tenant.slug}
      mode="create"
      assets={assets.map((asset) => ({
        id: asset.id,
        url: asset.url,
        originalName: asset.originalName,
      }))}
    />
  );
}
