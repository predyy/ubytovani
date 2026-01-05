import { NextResponse } from "next/server";
import { z } from "zod";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { requireAdminTenant } from "@/lib/uploads/admin-context";
import { getS3Client, getPublicUrlForKey } from "@/lib/uploads/s3";
import { getUploadConfig } from "@/lib/uploads/config";
import { isTenantAssetKey } from "@/lib/uploads/keys";
import { assetMaxBytes, assetMimeTypes } from "@/lib/uploads/constants";

const confirmSchema = z.object({
  key: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  originalName: z.string().min(1),
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

  const { key, mimeType, sizeBytes, originalName } = body;

  if (!isTenantAssetKey(key, context.tenant.id)) {
    return NextResponse.json({ error: "Invalid asset key." }, { status: 400 });
  }
  if (!assetMimeTypes.has(mimeType)) {
    return NextResponse.json({ error: "Unsupported asset type." }, { status: 400 });
  }
  if (sizeBytes > assetMaxBytes) {
    return NextResponse.json({ error: "Asset file is too large." }, { status: 400 });
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
    if (resolvedSize > assetMaxBytes) {
      return NextResponse.json({ error: "Asset file is too large." }, { status: 400 });
    }
    if (!assetMimeTypes.has(resolvedType)) {
      return NextResponse.json({ error: "Unsupported asset type." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Asset upload not found." }, { status: 404 });
  }

  const asset = await prisma.asset.create({
    data: {
      tenantId: context.tenant.id,
      key,
      url: getPublicUrlForKey(key),
      mimeType: resolvedType,
      sizeBytes: resolvedSize,
      originalName,
      createdByUserId: context.user.id,
    },
  });

  return NextResponse.json({ asset });
}
