import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string | null;
  replyTo?: string | null;
};

let cachedClient: SESClient | null = null;

function getSesClient() {
  if (!cachedClient) {
    const region = process.env.AWS_REGION;
    if (!region) {
      throw new Error("AWS_REGION is not configured.");
    }
    cachedClient = new SESClient({ region });
  }
  return cachedClient;
}

function getFromEmail() {
  const fromEmail = process.env.SES_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SES_FROM_EMAIL is not configured.");
  }
  return fromEmail;
}

function buildSource(fromEmail: string, fromName?: string | null) {
  const trimmedName = fromName?.trim();
  if (trimmedName) {
    return `${trimmedName} <${fromEmail}>`;
  }
  const defaultName = process.env.SES_FROM_NAME_DEFAULT?.trim();
  return defaultName ? `${defaultName} <${fromEmail}>` : fromEmail;
}

export async function sendSesEmail({
  to,
  subject,
  html,
  text,
  fromName,
  replyTo,
}: SendEmailParams) {
  const client = getSesClient();
  const fromEmail = getFromEmail();

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Source: buildSource(fromEmail, fromName),
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: html },
        ...(text ? { Text: { Data: text } } : {}),
      },
    },
  });

  const response = await client.send(command);
  return response.MessageId ?? null;
}
