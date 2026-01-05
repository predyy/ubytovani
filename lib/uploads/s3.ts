import { S3Client } from "@aws-sdk/client-s3";

import { getUploadConfig } from "@/lib/uploads/config";

let cachedClient: S3Client | null = null;

export function getS3Client() {
  if (cachedClient) {
    return cachedClient;
  }
  const { region } = getUploadConfig();
  cachedClient = new S3Client({ region });
  return cachedClient;
}

export function getPublicUrlForKey(key: string) {
  const { publicBaseUrl } = getUploadConfig();
  return `${publicBaseUrl}/${key}`;
}
