export type HeroProps = {
  title: string;
  subtitle: string;
  backgroundStyle: "solid" | "gradient";
  primaryButtonLabel?: string;
  primaryButtonHref?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type RichTextProps = {
  text: string;
};

export type FeaturesProps = {
  items: Array<{
    title: string;
    description: string;
  }>;
};

export type GalleryProps = {
  images: Array<{
    url: string;
  }>;
};

export type BookingCTAProps = {
  heading: string;
  text: string;
  buttonLabel: string;
};

export type AvailabilityCalendarProps = Record<string, never>;

export type BookingFormProps = Record<string, never>;

export type RoomsSectionProps = Record<string, never>;

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterProps = {
  copyright: string;
  links: FooterLink[];
};

type WithId<T> = T & {
  id?: string;
};

export type PuckBlock =
  | { type: "Hero"; props: WithId<HeroProps> }
  | { type: "RichText"; props: WithId<RichTextProps> }
  | { type: "Features"; props: WithId<FeaturesProps> }
  | { type: "Gallery"; props: WithId<GalleryProps> }
  | { type: "BookingCTA"; props: WithId<BookingCTAProps> }
  | { type: "AvailabilityCalendar"; props: WithId<AvailabilityCalendarProps> }
  | { type: "BookingForm"; props: WithId<BookingFormProps> }
  | { type: "RoomsSection"; props: WithId<RoomsSectionProps> }
  | { type: "Footer"; props: WithId<FooterProps> };

export type PuckDataShape = {
  content: PuckBlock[];
  root?: {
    props?: Record<string, unknown>;
  };
};

export const allowedBlockTypes = [
  "Hero",
  "RichText",
  "Features",
  "Gallery",
  "BookingCTA",
  "AvailabilityCalendar",
  "BookingForm",
  "RoomsSection",
  "Footer",
] as const;
