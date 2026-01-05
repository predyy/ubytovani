import type { Config } from "@measured/puck";

import BookingCTABlock from "@/components/puck/blocks/BookingCTA";
import FeaturesBlock from "@/components/puck/blocks/Features";
import FooterBlock from "@/components/puck/blocks/Footer";
import GalleryBlock from "@/components/puck/blocks/Gallery";
import HeroBlock from "@/components/puck/blocks/Hero";
import RichTextBlock from "@/components/puck/blocks/RichText";

export const puckConfig: Config = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        backgroundStyle: {
          type: "select",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Gradient", value: "gradient" },
          ],
        },
        primaryButtonLabel: { type: "text" },
        primaryButtonHref: { type: "text" },
        imageUrl: { type: "text" },
        imageAlt: { type: "text" },
      },
      defaultProps: {
        title: "A modern stay, tailored for your guests",
        subtitle:
          "Welcome guests with a beautiful single-page website that highlights your property and captures bookings directly.",
        backgroundStyle: "gradient",
        primaryButtonLabel: "Request availability",
        primaryButtonHref: "#booking",
        imageUrl:
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
        imageAlt: "Cozy guest room with natural light",
      },
      render: HeroBlock,
    },
    RichText: {
      fields: {
        text: { type: "textarea" },
      },
      defaultProps: {
        text:
          "Nestled near the coast, our property blends comfort with effortless hospitality. Enjoy spacious rooms, curated amenities, and a seamless booking experience.",
      },
      render: RichTextBlock,
    },
    Features: {
      fields: {
        items: {
          type: "array",
          arrayFields: {
            title: { type: "text" },
            description: { type: "textarea" },
          },
        },
      },
      defaultProps: {
        items: [
          {
            title: "Curated amenities",
            description: "Provide premium linens, locally sourced treats, and smart access.",
          },
          {
            title: "Flexible availability",
            description: "Update stays and rates in one place with instant publishing.",
          },
          {
            title: "Guest-ready support",
            description: "Deliver clear check-in instructions and quick responses.",
          },
        ],
      },
      render: FeaturesBlock,
    },
    Gallery: {
      fields: {
        images: {
          type: "array",
          arrayFields: {
            url: { type: "text" },
          },
        },
      },
      defaultProps: {
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
      render: GalleryBlock,
    },
    BookingCTA: {
      fields: {
        heading: { type: "text" },
        text: { type: "textarea" },
        buttonLabel: { type: "text" },
      },
      defaultProps: {
        heading: "Ready to plan your stay?",
        text:
          "Reach out today to confirm availability and receive a personalized offer.",
        buttonLabel: "Start booking",
      },
      render: BookingCTABlock,
    },
    Footer: {
      fields: {
        copyright: { type: "text" },
        links: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            href: { type: "text" },
          },
        },
      },
      defaultProps: {
        copyright: "(c) 2024 StayHost. All rights reserved.",
        links: [
          { label: "Terms", href: "#" },
          { label: "Privacy", href: "#" },
        ],
      },
      render: FooterBlock,
    },
  },
};
