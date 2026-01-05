"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { requireTenantRole } from "@/lib/tenancy/rbac";
import { sanitizePuckData } from "@/lib/puck/validation";

const saveSchema = z.object({
  tenantId: z.string().min(1),
  lang: z.string().min(2),
  data: z.unknown(),
});

const publishSchema = z.object({
  tenantId: z.string().min(1),
  lang: z.string().min(2),
});

export type SaveDraftResult = {
  error?: string;
  savedAt?: string;
};

export type PublishResult = {
  error?: string;
  publishedAt?: string;
};

export async function saveDraftAction(
  payload: unknown,
): Promise<SaveDraftResult> {
  const parsed = saveSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Invalid request payload." };
  }

  const { tenantId, lang, data } = parsed.data;
  const user = await requireUser({ lang, nextPath: `/${lang}/site-builder` });
  const membership = await requireTenantRole(user.id, tenantId, "STAFF");
  if (!membership) {
    return { error: "You do not have permission to edit this tenant." };
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.defaultLocale !== lang) {
    return { error: "Invalid tenant locale." };
  }

  const sanitized = sanitizePuckData(data);
  if (!sanitized) {
    return { error: "Draft contains invalid blocks." };
  }

  await prisma.sitePageConfig.upsert({
    where: {
      tenantId_locale_status: {
        tenantId,
        locale: tenant.defaultLocale,
        status: "DRAFT",
      },
    },
    update: {
      puckJson: sanitized,
    },
    create: {
      tenantId,
      locale: tenant.defaultLocale,
      status: "DRAFT",
      puckJson: sanitized,
    },
  });

  return { savedAt: new Date().toISOString() };
}

export async function publishSiteAction(
  payload: unknown,
): Promise<PublishResult> {
  const parsed = publishSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Invalid request payload." };
  }

  const { tenantId, lang } = parsed.data;
  const user = await requireUser({ lang, nextPath: `/${lang}/site-builder` });
  const membership = await requireTenantRole(user.id, tenantId, "ADMIN");
  if (!membership) {
    return { error: "Only admins can publish changes." };
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.defaultLocale !== lang) {
    return { error: "Invalid tenant locale." };
  }

  const draft = await prisma.sitePageConfig.findUnique({
    where: {
      tenantId_locale_status: {
        tenantId,
        locale: tenant.defaultLocale,
        status: "DRAFT",
      },
    },
  });

  if (!draft) {
    return { error: "No draft found to publish." };
  }

  const sanitized = sanitizePuckData(draft.puckJson);
  if (!sanitized) {
    return { error: "Draft contains invalid blocks." };
  }

  const publishedAt = new Date();
  await prisma.sitePageConfig.upsert({
    where: {
      tenantId_locale_status: {
        tenantId,
        locale: tenant.defaultLocale,
        status: "PUBLISHED",
      },
    },
    update: {
      puckJson: sanitized,
      publishedAt,
    },
    create: {
      tenantId,
      locale: tenant.defaultLocale,
      status: "PUBLISHED",
      puckJson: sanitized,
      publishedAt,
    },
  });

  return { publishedAt: publishedAt.toISOString() };
}
