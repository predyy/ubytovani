import { prisma } from "@/lib/prisma";
import { formatDateOnly } from "@/lib/dates";

type TenantIdentity = {
  id: string;
  name: string;
  slug: string;
  defaultLocale: string;
};

type BookingEmailContextResult = {
  context: Record<string, string>;
  tenant: TenantIdentity;
  locale: string;
  reservation: {
    id: string;
    guestEmail: string;
    guestName: string;
  };
};

function buildSiteUrl(tenantSlug: string, locale: string) {
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${tenantSlug}.${rootDomain}/${locale}`;
}

function buildAdminBookingsUrl(locale: string) {
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN ?? "app";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${adminSubdomain}.${rootDomain}/${locale}/bookings`;
}

export async function buildBookingEmailContext(
  reservationId: string,
): Promise<BookingEmailContextResult> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      tenant: true,
      room: true,
      property: true,
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  const locale = reservation.tenant.defaultLocale;
  const checkIn = formatDateOnly(reservation.checkInDate);
  const checkOut = formatDateOnly(reservation.checkOutDate);
  const nights = Math.max(
    1,
    Math.round(
      (reservation.checkOutDate.getTime() -
        reservation.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const siteUrl = buildSiteUrl(reservation.tenant.slug, locale);
  const adminBookingUrl = buildAdminBookingsUrl(locale);

  const context: Record<string, string> = {
    guestName: reservation.guestName,
    guestEmail: reservation.guestEmail,
    checkIn,
    checkOut,
    nights: String(nights),
    roomName: reservation.room?.name ?? "Room",
    propertyName: reservation.tenant.name,
    tenantName: reservation.tenant.name,
    siteUrl,
    adminBookingUrl,
    docsTermsUrl: `${siteUrl}/docs/terms`,
    docsPrivacyUrl: `${siteUrl}/docs/privacy`,
  };

  return {
    context,
    tenant: {
      id: reservation.tenant.id,
      name: reservation.tenant.name,
      slug: reservation.tenant.slug,
      defaultLocale: reservation.tenant.defaultLocale,
    },
    locale,
    reservation: {
      id: reservation.id,
      guestEmail: reservation.guestEmail,
      guestName: reservation.guestName,
    },
  };
}

export function buildSampleEmailContext(tenant: TenantIdentity) {
  const checkIn = "2025-05-12";
  const checkOut = "2025-05-15";
  const siteUrl = buildSiteUrl(tenant.slug, tenant.defaultLocale);
  const adminBookingUrl = buildAdminBookingsUrl(tenant.defaultLocale);

  return {
    guestName: "Alex Guest",
    guestEmail: "guest@example.com",
    checkIn,
    checkOut,
    nights: "3",
    roomName: "Deluxe Room",
    propertyName: tenant.name,
    tenantName: tenant.name,
    siteUrl,
    adminBookingUrl,
    docsTermsUrl: `${siteUrl}/docs/terms`,
    docsPrivacyUrl: `${siteUrl}/docs/privacy`,
  };
}

export async function getHostRecipientEmails(tenantId: string) {
  const members = await prisma.tenantMember.findMany({
    where: {
      tenantId,
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: { user: { select: { email: true } } },
  });

  const emails = new Set<string>();
  members.forEach((member) => {
    if (member.user.email) {
      emails.add(member.user.email);
    }
  });

  return Array.from(emails);
}
