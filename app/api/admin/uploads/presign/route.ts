import { NextResponse } from "next/server";
import { z } from "zod";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

import { getS3Client, getPublicUrlForKey } from "@/lib/uploads/s3";
import { getUploadConfig } from "@/lib/uploads/config";
import {
  assetMaxBytes,
  assetMimeTypes,
  docMaxBytes,
  docMimeTypes,
  staticDocSlugs,
  type StaticDocSlug,
} from "@/lib/uploads/constants";
import { buildAssetKey, buildDocKey } from "@/lib/uploads/keys";
import { requireAdminTenant } from "@/lib/uploads/admin-context";

const presignSchema = z.object({
  kind: z.enum(["ASSET", "DOC"]),
  mimeType: z.string().min(1),
  fileName: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  slug: z.string().optional(),
  locale: z.string().optional(),
});

export async function POST(request: Request) {
  const context = await requireAdminTenant("STAFF");
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  let body: z.infer<typeof presignSchema>;
  try {
    body = presignSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { kind, mimeType, fileName, sizeBytes } = body;

  if (kind === "ASSET") {
    if (!assetMimeTypes.has(mimeType)) {
      return NextResponse.json({ error: "Unsupported asset type." }, { status: 400 });
    }
    if (sizeBytes > assetMaxBytes) {
      return NextResponse.json({ error: "Asset file is too large." }, { status: 400 });
    }

    const key = buildAssetKey(context.tenant.id, fileName);
    const { bucket } = getUploadConfig();
    const { url, fields } = await createPresignedPost(getS3Client(), {
      Bucket: bucket,
      Key: key,
      Conditions: [
        ["content-length-range", 0, assetMaxBytes],
        ["eq", "$Content-Type", mimeType],
      ],
      Fields: {
        "Content-Type": mimeType,
      },
      Expires: 60,
    });

    return NextResponse.json({
      uploadUrl: url,
      fields,
      key,
      publicUrl: getPublicUrlForKey(key),
    });
  }

  const slug = body.slug;
  const locale = body.locale;
  if (!slug || !staticDocSlugs.includes(slug as (typeof staticDocSlugs)[number])) {
    return NextResponse.json({ error: "Invalid document slug." }, { status: 400 });
  }
  if (!locale || locale !== context.tenant.defaultLocale) {
    return NextResponse.json({ error: "Invalid document locale." }, { status: 400 });
  }
  if (!docMimeTypes.has(mimeType)) {
    return NextResponse.json({ error: "Unsupported document type." }, { status: 400 });
  }
  if (sizeBytes > docMaxBytes) {
    return NextResponse.json({ error: "Document file is too large." }, { status: 400 });
  }

  const key = buildDocKey(
    context.tenant.id,
    locale,
    slug as StaticDocSlug,
    fileName,
  );
  const { bucket } = getUploadConfig();
  const { url, fields } = await createPresignedPost(getS3Client(), {
    Bucket: bucket,
    Key: key,
    Conditions: [
      ["content-length-range", 0, docMaxBytes],
      ["eq", "$Content-Type", mimeType],
    ],
    Fields: {
      "Content-Type": mimeType,
    },
    Expires: 60,
  });

  return NextResponse.json({
    uploadUrl: url,
    fields,
    key,
    publicUrl: getPublicUrlForKey(key),
  });
}
