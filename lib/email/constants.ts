import type { EmailTemplateType } from "@prisma/client";

export const EMAIL_TEMPLATE_ORDER: EmailTemplateType[] = [
  "BOOKING_REQUEST_GUEST",
  "BOOKING_REQUEST_HOST",
  "BOOKING_CONFIRMED_GUEST",
  "BOOKING_CONFIRMED_HOST",
  "BOOKING_CANCELLED_GUEST",
  "BOOKING_CANCELLED_HOST",
];
