import type { EmailLogStatus, EmailTemplateType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { escapeHtml, renderTemplate } from "@/lib/email/render";
import { sendSesEmail } from "@/lib/email/ses";

type SendTenantEmailOptions = {
  tenantId: string;
  type: EmailTemplateType;
  locale: string;
  toEmail: string;
  context: Record<string, string>;
  reservationId?: string | null;
  ignoreEnabled?: boolean;
};

type SendTenantEmailResult = {
  status: "sent" | "failed" | "skipped";
  error?: string;
};

export async function sendTenantEmail({
  tenantId,
  type,
  locale,
  toEmail,
  context,
  reservationId,
  ignoreEnabled,
}: SendTenantEmailOptions): Promise<SendTenantEmailResult> {
  const template =
    (await prisma.emailTemplate.findFirst({
      where: { tenantId, type, locale },
    })) ??
    (await prisma.emailTemplate.findFirst({
      where: { tenantId: null, type, locale },
    }));

  if (!template) {
    return { status: "skipped", error: "Template not found." };
  }

  if (!template.enabled && !ignoreEnabled) {
    return { status: "skipped" };
  }

  const existingLog =
    reservationId && reservationId.length > 0
      ? await prisma.emailLog.findFirst({
          where: {
            reservationId,
            type,
            locale,
            toEmail,
          },
        })
      : null;

  if (existingLog?.status === "SENT") {
    return { status: "skipped" };
  }

  const subject = renderTemplate(template.subject, context);
  const htmlBody = renderTemplate(template.htmlBody, context, {
    escape: escapeHtml,
  });
  const textBody = template.textBody
    ? renderTemplate(template.textBody, context)
    : undefined;

  let status: EmailLogStatus = "SENT";
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  try {
    providerMessageId = await sendSesEmail({
      to: toEmail,
      subject,
      html: htmlBody,
      text: textBody,
      fromName: template.fromName,
      replyTo: template.replyTo,
    });
  } catch (error) {
    status = "FAILED";
    errorMessage = error instanceof Error ? error.message : "Email send failed.";
  }

  const fromEmail = process.env.SES_FROM_EMAIL ?? "unknown";

  if (existingLog) {
    await prisma.emailLog.update({
      where: { id: existingLog.id },
      data: {
        status,
        subject,
        fromEmail,
        providerMessageId,
        error: errorMessage,
      },
    });
  } else {
    await prisma.emailLog.create({
      data: {
        tenantId,
        reservationId: reservationId || null,
        type,
        locale,
        toEmail,
        fromEmail,
        subject,
        status,
        providerMessageId,
        error: errorMessage,
      },
    });
  }

  return status === "SENT"
    ? { status: "sent" }
    : { status: "failed", error: errorMessage ?? undefined };
}
