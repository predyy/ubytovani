import type { PuckDataShape } from "@/lib/puck/types";

export const starterPuckData: PuckDataShape = {
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
        imageUrl:
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
        imageAlt: "Suite with neutral tones and daylight",
      },
    },
    {
      type: "RichText",
      props: {
        text:
          "Our property offers serene interiors, thoughtful details, and a seamless arrival experience. From sunrise coffee to curated local recommendations, everything is designed to make guests feel at home.",
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
        text:
          "Share your dates and we will confirm availability within 24 hours.",
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
