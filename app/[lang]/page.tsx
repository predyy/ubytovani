import { headers } from "next/headers";
import { redirect } from "next/navigation";

import LandingPage from "@/components/marketing/LandingPage";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type LangRootPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function LangRootPage({ params }: LangRootPageProps) {
  const { lang } = await params;
  const headerList = await headers();
  const mode = headerList.get("x-tenant-mode") ?? "marketing";

  if (mode === "admin") {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/${lang}/login`);
    }

    const membership = await prisma.tenantMember.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
    });

    redirect(membership ? `/${lang}/dashboard` : `/${lang}/onboarding`);
  }

  return <LandingPage lang={lang} />;
}
