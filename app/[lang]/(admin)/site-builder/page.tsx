import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SiteBuilderClient from "@/components/admin/SiteBuilderClient";
import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import { starterPuckData } from "@/lib/puck/starter";
import type { PuckDataShape } from "@/lib/puck/types";
import { ensurePuckIds, sanitizePuckData } from "@/lib/puck/validation";

type SiteBuilderPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function SiteBuilderPage({
  params,
}: SiteBuilderPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/site-builder`,
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

  const tenant = membership.tenant;
  if (tenant.defaultLocale !== lang) {
    redirect(`/${tenant.defaultLocale}/site-builder`);
  }

  const draft = await prisma.sitePageConfig.findUnique({
    where: {
      tenantId_locale_status: {
        tenantId: tenant.id,
        locale: tenant.defaultLocale,
        status: "DRAFT",
      },
    },
  });

  const published = await prisma.sitePageConfig.findUnique({
    where: {
      tenantId_locale_status: {
        tenantId: tenant.id,
        locale: tenant.defaultLocale,
        status: "PUBLISHED",
      },
    },
  });

  const sanitizedDraft = draft ? sanitizePuckData(draft.puckJson) : null;
  const initialData = ensurePuckIds(
    (sanitizedDraft ?? starterPuckData) as PuckDataShape,
  );
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const publicUrl = `${protocol}://${tenant.slug}.${rootDomain}/${tenant.defaultLocale}`;
  const canPublish = membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <SiteBuilderClient
      tenantId={tenant.id}
      tenantName={tenant.name}
      lang={tenant.defaultLocale}
      publicUrl={publicUrl}
      initialData={initialData}
      lastSavedAt={draft?.updatedAt?.toISOString() ?? null}
      lastPublishedAt={
        published?.publishedAt?.toISOString() ??
        published?.updatedAt?.toISOString() ??
        null
      }
      canPublish={canPublish}
    />
  );
}
