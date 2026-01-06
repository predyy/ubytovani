import type { EmailTemplateType } from "@prisma/client";

import {
  buildBookingEmailContext,
  getHostRecipientEmails,
} from "@/lib/email/context";
import { sendTenantEmail } from "@/lib/email/service";

async function sendEmailsForReservation(
  reservationId: string,
  types: {
    guest: EmailTemplateType;
    host?: EmailTemplateType;
  },
) {
  const result = await buildBookingEmailContext(reservationId);

  const tasks: Array<Promise<unknown>> = [];

  tasks.push(
    sendTenantEmail({
      tenantId: result.tenant.id,
      type: types.guest,
      locale: result.locale,
      toEmail: result.reservation.guestEmail,
      context: result.context,
      reservationId,
    }),
  );

  if (types.host) {
    const hostRecipients = await getHostRecipientEmails(result.tenant.id);
    hostRecipients.forEach((email) => {
      tasks.push(
        sendTenantEmail({
          tenantId: result.tenant.id,
          type: types.host!,
          locale: result.locale,
          toEmail: email,
          context: result.context,
          reservationId,
        }),
      );
    });
  }

  await Promise.all(tasks);
}

export async function sendBookingRequestEmails(reservationId: string) {
  await sendEmailsForReservation(reservationId, {
    guest: "BOOKING_REQUEST_GUEST",
    host: "BOOKING_REQUEST_HOST",
  });
}

export async function sendBookingConfirmedEmails(reservationId: string) {
  await sendEmailsForReservation(reservationId, {
    guest: "BOOKING_CONFIRMED_GUEST",
    host: "BOOKING_CONFIRMED_HOST",
  });
}

export async function sendBookingCancelledEmails(reservationId: string) {
  await sendEmailsForReservation(reservationId, {
    guest: "BOOKING_CANCELLED_GUEST",
    host: "BOOKING_CANCELLED_HOST",
  });
}
