import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import EmailsManager from "@/components/admin/EmailsManager";
import { EMAIL_TEMPLATE_ORDER } from "@/lib/email/constants";

type EmailsPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function EmailsPage({ params }: EmailsPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/emails`,
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

  const locale = membership.tenant.defaultLocale;

  const [tenantTemplates, defaultTemplates, logs] = await Promise.all([
    prisma.emailTemplate.findMany({
      where: { tenantId: membership.tenantId, locale },
    }),
    prisma.emailTemplate.findMany({
      where: { tenantId: null, locale },
    }),
    prisma.emailLog.findMany({
      where: { tenantId: membership.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const templateMap = new Map(defaultTemplates.map((template) => [template.type, template]));
  tenantTemplates.forEach((template) => {
    templateMap.set(template.type, template);
  });

  const mergedTemplates = EMAIL_TEMPLATE_ORDER.map((type) => templateMap.get(type)).filter(
    (template): template is NonNullable<typeof template> => Boolean(template),
  );

  return (
    <EmailsManager
      lang={lang}
      tenantSlug={membership.tenant.slug}
      locale={locale}
      canManageSettings={["ADMIN", "OWNER"].includes(membership.role)}
      templates={mergedTemplates.map((template) => ({
        id: template.id,
        type: template.type,
        locale: template.locale,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        enabled: template.enabled,
        fromName: template.fromName,
        replyTo: template.replyTo,
        updatedAt: template.updatedAt.toISOString(),
      }))}
      logs={logs.map((log) => ({
        id: log.id,
        type: log.type,
        locale: log.locale,
        toEmail: log.toEmail,
        subject: log.subject,
        status: log.status,
        error: log.error,
        createdAt: log.createdAt.toISOString(),
      }))}
    />
  );
}
