import { randomUUID } from "node:crypto";

import type { StaticDocSlug } from "@/lib/uploads/constants";

const maxFileNameLength = 120;

export function sanitizeFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() ?? "file";
  const cleaned = baseName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.slice(0, maxFileNameLength) || "file";
}

export function buildAssetKey(tenantId: string, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  return `public/tenants/${tenantId}/assets/${randomUUID()}-${safeName}`;
}

export function buildDocKey(
  tenantId: string,
  locale: string,
  slug: StaticDocSlug,
  fileName: string,
) {
  const safeName = sanitizeFileName(fileName);
  return `public/tenants/${tenantId}/docs/${locale}/${slug}/${randomUUID()}-${safeName}`;
}

export function isTenantAssetKey(key: string, tenantId: string) {
  return key.startsWith(`public/tenants/${tenantId}/assets/`);
}

export function isTenantDocKey(
  key: string,
  tenantId: string,
  locale: string,
  slug: StaticDocSlug,
) {
  return key.startsWith(`public/tenants/${tenantId}/docs/${locale}/${slug}/`);
}
