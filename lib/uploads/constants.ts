export const assetMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const docMimeTypes = new Set([
  "text/markdown",
  "application/pdf",
]);

export const assetMaxBytes = 10 * 1024 * 1024;
export const docMaxBytes = 15 * 1024 * 1024;

export const staticDocSlugs = ["terms", "privacy"] as const;
export type StaticDocSlug = (typeof staticDocSlugs)[number];
