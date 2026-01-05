"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { setActiveTenantCookie } from "@/lib/auth/cookies";
import { slugify } from "@/lib/tenancy/slug";
import { supportedLocales } from "@/lib/i18n/locales";
import { starterPuckData } from "@/lib/puck/starter";
import { ensurePuckIds } from "@/lib/puck/validation";

export type OnboardingActionState = {
  error?: string;
};

const tenantSchema = z.object({
  name: z.string().min(2, "Tenant name is required."),
  slug: z.string().optional(),
  defaultLocale: z.string().min(2),
  lang: z.string().min(2),
});

const propertySchema = z.object({
  tenantId: z.string().min(1),
  propertyType: z.string().min(2, "Property type is required."),
  roomCount: z.coerce.number().int().positive(),
  maxGuests: z.coerce.number().int().positive().optional().or(z.literal("")),
  lang: z.string().min(2),
});

export async function createTenantAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = tenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    defaultLocale: formData.get("defaultLocale"),
    lang: formData.get("lang"),
  });

  if (!parsed.success) {
    return { error: "Please provide a valid tenant name and locale." };
  }

  const { name, slug, defaultLocale, lang } = parsed.data;
  const trimmedName = name.trim();
  if (!supportedLocales.includes(defaultLocale)) {
    return { error: "Selected locale is not supported." };
  }

  const normalizedSlug = slugify(slug?.length ? slug : trimmedName);
  if (!normalizedSlug || normalizedSlug.length < 3) {
    return { error: "Slug must be at least 3 characters." };
  }

  const existing = await prisma.tenant.findUnique({
    where: { slug: normalizedSlug },
  });
  if (existing) {
    return { error: "That slug is already taken." };
  }

  const user = await requireUser({ lang, nextPath: `/${lang}/onboarding` });

  const tenant = await prisma.tenant.create({
    data: {
      name: trimmedName,
      slug: normalizedSlug,
      plan: "FREE",
      defaultLocale,
      enabledLocales: [defaultLocale],
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  await setActiveTenantCookie(tenant.id);
  redirect(`/${lang}/onboarding`);
}

export async function createPropertyAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = propertySchema.safeParse({
    tenantId: formData.get("tenantId"),
    propertyType: formData.get("propertyType"),
    roomCount: formData.get("roomCount"),
    maxGuests: formData.get("maxGuests"),
    lang: formData.get("lang"),
  });

  if (!parsed.success) {
    return { error: "Please provide valid property details." };
  }

  const { tenantId, propertyType, roomCount, maxGuests, lang } = parsed.data;
  const user = await requireUser({ lang, nextPath: `/${lang}/onboarding` });

  const membership = await prisma.tenantMember.findFirst({
    where: {
      userId: user.id,
      tenantId,
    },
  });

  if (!membership) {
    return { error: "You do not have access to this tenant." };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return { error: "Tenant not found." };
  }

  const existingProperty = await prisma.property.findFirst({
    where: { tenantId },
  });

  if (existingProperty) {
    redirect(`/${lang}/onboarding`);
  }

  const maxGuestsValue =
    typeof maxGuests === "number" && Number.isFinite(maxGuests)
      ? maxGuests
      : null;

  const placeholderConfig = ensurePuckIds(starterPuckData);

  await prisma.$transaction(async (tx) => {
    await tx.property.create({
      data: {
        tenantId,
        propertyType,
        roomCount,
        maxGuests: maxGuestsValue,
      },
    });

    await tx.sitePageConfig.upsert({
      where: {
        tenantId_locale_status: {
          tenantId,
          locale: tenant.defaultLocale,
          status: "DRAFT",
        },
      },
      update: {},
      create: {
        tenantId,
        locale: tenant.defaultLocale,
        status: "DRAFT",
        puckJson: placeholderConfig,
      },
    });

    await tx.sitePageConfig.upsert({
      where: {
        tenantId_locale_status: {
          tenantId,
          locale: tenant.defaultLocale,
          status: "PUBLISHED",
        },
      },
      update: {},
      create: {
        tenantId,
        locale: tenant.defaultLocale,
        status: "PUBLISHED",
        puckJson: placeholderConfig,
        publishedAt: new Date(),
      },
    });

    const defaults = await tx.emailTemplate.findMany({
      where: {
        tenantId: null,
        locale: tenant.defaultLocale,
      },
    });

    for (const template of defaults) {
      await tx.emailTemplate.upsert({
        where: {
          tenantId_type_locale: {
            tenantId,
            type: template.type,
            locale: template.locale,
          },
        },
        update: {
          subject: template.subject,
          htmlBody: template.htmlBody,
          enabled: template.enabled,
          fromName: template.fromName,
          replyTo: template.replyTo,
        },
        create: {
          tenantId,
          type: template.type,
          locale: template.locale,
          subject: template.subject,
          htmlBody: template.htmlBody,
          enabled: template.enabled,
          fromName: template.fromName,
          replyTo: template.replyTo,
        },
      });
    }
  });

  await setActiveTenantCookie(tenantId);
  redirect(`/${lang}/onboarding`);
}
