import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AdminNav from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { getMessages } from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{
    lang: string;
  }>;
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { lang } = await params;
  const headerList = await headers();
  const mode = headerList.get("x-tenant-mode") ?? "marketing";
  const messages = getMessages(lang);
  const copy = messages.admin.layout;

  if (mode !== "admin") {
    redirect(`/${lang}`);
  }

  const user = await getCurrentUser();
  if (!user) {
    return children;
  }

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
    return children;
  }

  const property = await prisma.property.findFirst({
    where: { tenantId: membership.tenantId },
  });

  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const publicUrl = `${protocol}://${membership.tenant.slug}.${rootDomain}/${membership.tenant.defaultLocale}`;

  const navItems = [
    { label: copy.navItems.dashboard, href: `/${lang}/dashboard`, icon: DashboardIcon },
    { label: copy.navItems.siteBuilder, href: `/${lang}/site-builder`, icon: LayoutIcon },
    { label: copy.navItems.assets, href: `/${lang}/assets`, icon: ImageIcon },
    { label: copy.navItems.docs, href: `/${lang}/docs`, icon: DocIcon },
    { label: copy.navItems.rooms, href: `/${lang}/rooms`, icon: RoomsIcon },
    { label: copy.navItems.availability, href: `/${lang}/availability`, icon: CalendarIcon },
    { label: copy.navItems.bookings, href: `/${lang}/bookings`, icon: TicketsIcon },
    { label: copy.navItems.emails, href: `/${lang}/emails`, icon: MailIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-slate-200/70 bg-white/95 p-6 lg:flex lg:flex-col">
        <AdminNav
          lang={lang}
          tenantName={membership.tenant.name}
          propertyType={property?.propertyType ?? null}
          publicUrl={publicUrl}
          items={navItems}
        />
      </aside>
      <div className="min-h-screen">
        <div className="border-b border-slate-200/70 bg-white lg:hidden">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-4 text-sm font-semibold text-slate-700">
              <span>{copy.adminMenu}</span>
              <span className="text-xs text-slate-400 group-open:rotate-180 transition">▾</span>
            </summary>
            <div className="border-t border-slate-200/70 px-4 py-4">
              <AdminNav
                lang={lang}
                tenantName={membership.tenant.name}
                propertyType={property?.propertyType ?? null}
                publicUrl={publicUrl}
                items={navItems}
              />
            </div>
          </details>
        </div>
        {children}
      </div>
    </div>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 13h8V3H3z" />
      <path d="M13 21h8v-8h-8z" />
      <path d="M13 3h8v6h-8z" />
      <path d="M3 21h8v-6H3z" />
    </svg>
  );
}

function LayoutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="8" height="6" rx="2" />
      <rect x="13" y="14" width="8" height="6" rx="2" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M21 17l-5-5-4 4-2-2-4 4" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2" />
    </svg>
  );
}

function TicketsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 8a2 2 0 0 1 2-2h3a2 2 0 0 0 2-2h4a2 2 0 0 0 2 2h3a2 2 0 0 1 2 2v3a2 2 0 0 0-2 2 2 2 0 0 0 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 0-2 2h-4a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 2-2 2 2 0 0 0-2-2z" />
      <path d="M8 8h.01M16 16h.01" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function RoomsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
