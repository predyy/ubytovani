const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const locale = "en";
  const starterConfig = {
    content: [
      {
        type: "Hero",
        props: {
          title: "A refined stay crafted for modern travelers",
          subtitle:
            "Showcase your accommodation with a sleek single-page site and turn inquiries into confirmed bookings.",
          backgroundStyle: "gradient",
          primaryButtonLabel: "Request availability",
          primaryButtonHref: "#booking",
        },
      },
      {
        type: "RichText",
        props: {
          text:
            "Our property offers serene interiors, thoughtful details, and a seamless arrival experience.",
        },
      },
      {
        type: "Features",
        props: {
          items: [
            {
              title: "Thoughtful amenities",
              description: "Premium linens, fast Wi-Fi, and flexible self check-in.",
            },
            {
              title: "Local recommendations",
              description: "Share your favorite beaches, cafes, and hidden gems.",
            },
            {
              title: "Always in sync",
              description: "Manage availability and bookings from one dashboard.",
            },
          ],
        },
      },
      {
        type: "Gallery",
        props: {
          images: [
            {
              url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
            },
            {
              url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
            },
            {
              url: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
            },
          ],
        },
      },
      {
        type: "BookingCTA",
        props: {
          heading: "Ready to plan your stay?",
          text: "Share your dates and we will confirm availability within 24 hours.",
          buttonLabel: "Start booking",
        },
      },
      {
        type: "Footer",
        props: {
          copyright: "(c) 2024 StayHost. All rights reserved.",
          links: [
            { label: "Terms", href: "#" },
            { label: "Privacy", href: "#" },
          ],
        },
      },
    ],
    root: {
      props: {},
    },
  };
  const templates = [
    {
      type: "BOOKING_REQUEST_GUEST",
      subject: "We received your booking request",
      htmlBody:
        "<p>Hi {{guestName}},</p><p>Thanks for your request. We will confirm availability shortly.</p>",
    },
    {
      type: "BOOKING_REQUEST_HOST",
      subject: "New booking request received",
      htmlBody:
        "<p>You have a new booking request from {{guestName}} for {{checkIn}} to {{checkOut}}.</p>",
    },
    {
      type: "BOOKING_CONFIRMED_GUEST",
      subject: "Your booking is confirmed",
      htmlBody:
        "<p>Great news, {{guestName}}! Your booking is confirmed for {{checkIn}} to {{checkOut}}.</p>",
    },
    {
      type: "BOOKING_CONFIRMED_HOST",
      subject: "Booking confirmed",
      htmlBody:
        "<p>Your booking with {{guestName}} is confirmed. Guests arrive on {{checkIn}}.</p>",
    },
    {
      type: "BOOKING_CANCELLED_GUEST",
      subject: "Your booking has been cancelled",
      htmlBody:
        "<p>Hi {{guestName}}, your booking for {{checkIn}} to {{checkOut}} was cancelled.</p>",
    },
    {
      type: "BOOKING_CANCELLED_HOST",
      subject: "Booking cancelled",
      htmlBody:
        "<p>The booking for {{guestName}} ({{checkIn}} to {{checkOut}}) was cancelled.</p>",
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: {
        tenantId_type_locale: {
          tenantId: null,
          type: template.type,
          locale,
        },
      },
      update: template,
      create: {
        tenantId: null,
        locale,
        enabled: true,
        ...template,
      },
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: "tenant1" },
    update: {},
    create: {
      name: "Demo Tenant",
      slug: "tenant1",
      plan: "FREE",
      defaultLocale: locale,
      enabledLocales: [locale],
    },
  });

  await prisma.sitePageConfig.upsert({
    where: {
      tenantId_locale_status: {
        tenantId: tenant.id,
        locale,
        status: "DRAFT",
      },
    },
    update: {
      puckJson: starterConfig,
    },
    create: {
      tenantId: tenant.id,
      locale,
      status: "DRAFT",
      puckJson: starterConfig,
    },
  });

  await prisma.sitePageConfig.upsert({
    where: {
      tenantId_locale_status: {
        tenantId: tenant.id,
        locale,
        status: "PUBLISHED",
      },
    },
    update: {
      puckJson: starterConfig,
      publishedAt: new Date(),
    },
    create: {
      tenantId: tenant.id,
      locale,
      status: "PUBLISHED",
      puckJson: starterConfig,
      publishedAt: new Date(),
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
