import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";

import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { formatMessage, getMessages } from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";

type DashboardPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { lang } = await params;
  const user = await requireUser({
    lang,
    nextPath: `/${lang}/dashboard`,
  });
  const messages = getMessages(lang);
  const copy = messages.admin.dashboard;
  const navItems = messages.admin.layout.navItems;

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
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold text-slate-900">
            {copy.noTenantTitle}
          </h1>
          <p className="mt-3 text-slate-600">
            {copy.noTenantDescription}
          </p>
          <Link
            href={`/${lang}/onboarding`}
            className="mt-6 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {copy.startOnboarding}
          </Link>
        </div>
      </main>
    );
  }

  const property = await prisma.property.findFirst({
    where: { tenantId: membership.tenantId },
  });

  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const publicUrl = `${protocol}://${membership.tenant.slug}.${rootDomain}/${membership.tenant.defaultLocale}`;

  return (
    <main className="min-h-screen bg-transparent">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {copy.headerEyebrow}
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">
              {copy.headerTitle}
            </h1>
            <p className="mt-2 text-slate-600">
              {copy.headerDescription}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={publicUrl}
              className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              {copy.viewPublicSite}
            </a>
            <form action={logoutAction}>
              <input type="hidden" name="lang" value={lang} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {copy.logout}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <IconBadge>
                <TenantIcon />
              </IconBadge>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {copy.tenantLabel}
              </p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {membership.tenant.slug}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {copy.defaultLocale}: {membership.tenant.defaultLocale.toUpperCase()}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <IconBadge>
                <HomeIcon />
              </IconBadge>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {copy.propertyLabel}
              </p>
            </div>
            {property ? (
              <>
                <p className="mt-4 text-2xl font-semibold text-slate-900">
                  {property.propertyType}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {copy.roomsLabel}: {property.roomCount}
                  {property.maxGuests
                    ? ` - ${copy.maxGuestsLabel}: ${property.maxGuests}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                {copy.addPropertyHint}
              </p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <IconBadge>
                <LinkIcon />
              </IconBadge>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {copy.publicUrlLabel}
              </p>
            </div>
            <p className="mt-4 text-sm text-slate-700">{publicUrl}</p>
            <p className="mt-2 text-xs text-slate-400">
              {copy.shareHint}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: navItems.siteBuilder,
              href: `/${lang}/site-builder`,
              icon: <LayoutIcon />,
            },
            {
              label: navItems.assets,
              href: `/${lang}/assets`,
              icon: <ImageIcon />,
            },
            {
              label: navItems.docs,
              href: `/${lang}/docs`,
              icon: <DocIcon />,
            },
            {
              label: navItems.rooms,
              href: `/${lang}/rooms`,
              icon: <HomeIcon />,
            },
            {
              label: navItems.availability,
              href: `/${lang}/availability`,
              icon: <CalendarIcon />,
            },
            {
              label: navItems.bookings,
              href: `/${lang}/bookings`,
              icon: <TicketsIcon />,
            },
            {
              label: navItems.emails,
              href: `/${lang}/emails`,
              icon: <MailIcon />,
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  {item.label}
                </div>
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                  <div className="flex h-full w-full items-center justify-center">
                    {item.icon}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {formatMessage(copy.openWorkspace, { label: item.label })}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      {children}
    </div>
  );
}

function TenantIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M12 3v18" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L14 19" />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="8" height="6" rx="2" />
      <rect x="13" y="14" width="8" height="6" rx="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M21 17l-5-5-4 4-2-2-4 4" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function TicketsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16v4a2 2 0 0 1 0 4v4H4v-4a2 2 0 0 0 0-4V7z" />
      <path d="M8 7v10" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
