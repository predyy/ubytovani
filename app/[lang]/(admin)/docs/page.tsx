import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import StaticDocsManager from "@/components/admin/StaticDocsManager";

type DocsPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function DocsPage({ params }: DocsPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/docs`,
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

  const docs = await prisma.staticDoc.findMany({
    where: {
      tenantId: membership.tenantId,
      locale: membership.tenant.defaultLocale,
    },
  });

  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const publicBase = `${protocol}://${membership.tenant.slug}.${rootDomain}`;

  return (
    <StaticDocsManager
      lang={lang}
      tenantSlug={membership.tenant.slug}
      locale={membership.tenant.defaultLocale}
      publicBaseUrl={publicBase}
      docs={docs.map((doc) => ({
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        s3Key: doc.s3Key,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        originalName: doc.originalName,
        updatedAt: doc.updatedAt.toISOString(),
      }))}
    />
  );
}
