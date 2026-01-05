import type { ReactNode } from "react";
import Link from "next/link";

import OnboardingPropertyForm from "@/components/admin/OnboardingPropertyForm";
import OnboardingTenantForm from "@/components/admin/OnboardingTenantForm";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  createPropertyAction,
  createTenantAction,
} from "@/lib/tenancy/actions";
import { fallbackLocale, supportedLocales } from "@/lib/i18n/locales";

type OnboardingPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/onboarding`,
  });

  const membership = await prisma.tenantMember.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return (
      <OnboardingShell
        title="Create your tenant"
        subtitle="Start by naming your accommodation business and choosing a subdomain."
        step={1}
      >
        <OnboardingTenantForm
          lang={lang}
          supportedLocales={supportedLocales}
          defaultLocale={fallbackLocale}
          action={createTenantAction}
        />
      </OnboardingShell>
    );
  }

  const property = await prisma.property.findFirst({
    where: { tenantId: membership.tenantId },
  });

  if (!property) {
    return (
      <OnboardingShell
        title="Tell us about your property"
        subtitle="We use these basics to personalize your dashboard and website."
        step={2}
      >
        <OnboardingPropertyForm
          lang={lang}
          tenantId={membership.tenantId}
          action={createPropertyAction}
        />
      </OnboardingShell>
    );
  }

  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const publicUrl = `${protocol}://${membership.tenant.slug}.${rootDomain}/${membership.tenant.defaultLocale}`;

  return (
    <OnboardingShell
      title="Your site is ready"
      subtitle="We created your initial site content and email templates."
      step={3}
    >
      <div className="space-y-6 text-left">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <p className="text-sm text-blue-700">Your public URL</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">
            {publicUrl}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${lang}/dashboard`}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to dashboard
          </Link>
          <a
            href={publicUrl}
            className="inline-flex items-center justify-center rounded-full border border-blue-200 px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            View public site
          </a>
        </div>
      </div>
    </OnboardingShell>
  );
}

function OnboardingShell({
  title,
  subtitle,
  step,
  children,
}: {
  title: string;
  subtitle: string;
  step: number;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              {step}
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
