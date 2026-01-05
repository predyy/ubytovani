import { NextResponse } from "next/server";
import { z } from "zod";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";
import { getS3Client } from "@/lib/uploads/s3";
import { getUploadConfig } from "@/lib/uploads/config";
import {
  docMaxBytes,
  docMimeTypes,
  staticDocSlugs,
  type StaticDocSlug,
} from "@/lib/uploads/constants";
import { isTenantDocKey } from "@/lib/uploads/keys";

const confirmSchema = z.object({
  key: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  originalName: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  locale: z.string().min(1),
});

export async function POST(request: Request) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  let body: z.infer<typeof confirmSchema>;
  try {
    body = confirmSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { key, mimeType, sizeBytes, originalName, title, slug, locale } = body;

  if (!staticDocSlugs.includes(slug as StaticDocSlug)) {
    return NextResponse.json({ error: "Invalid document slug." }, { status: 400 });
  }
  if (locale !== context.tenant.defaultLocale) {
    return NextResponse.json({ error: "Invalid document locale." }, { status: 400 });
  }
  if (!docMimeTypes.has(mimeType)) {
    return NextResponse.json({ error: "Unsupported document type." }, { status: 400 });
  }
  if (sizeBytes > docMaxBytes) {
    return NextResponse.json({ error: "Document file is too large." }, { status: 400 });
  }
  if (
    !isTenantDocKey(key, context.tenant.id, locale, slug as StaticDocSlug)
  ) {
    return NextResponse.json({ error: "Invalid document key." }, { status: 400 });
  }

  const { bucket } = getUploadConfig();
  let resolvedSize = sizeBytes;
  let resolvedType = mimeType;
  try {
    const head = await getS3Client().send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (head.ContentLength) {
      resolvedSize = head.ContentLength;
    }
    if (head.ContentType) {
      resolvedType = head.ContentType;
    }
    if (resolvedSize > docMaxBytes) {
      return NextResponse.json({ error: "Document file is too large." }, { status: 400 });
    }
    if (!docMimeTypes.has(resolvedType)) {
      return NextResponse.json({ error: "Unsupported document type." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Document upload not found." }, { status: 404 });
  }

  const staticDoc = await prisma.staticDoc.upsert({
    where: {
      tenantId_locale_slug: {
        tenantId: context.tenant.id,
        locale,
        slug,
      },
    },
    update: {
      title,
      s3Key: key,
      mimeType,
      sizeBytes,
      originalName,
      createdByUserId: context.user.id,
    },
    create: {
      tenantId: context.tenant.id,
      locale,
      slug,
      title,
      s3Key: key,
      mimeType: resolvedType,
      sizeBytes: resolvedSize,
      originalName,
      createdByUserId: context.user.id,
    },
  });

  return NextResponse.json({ staticDoc });
}
