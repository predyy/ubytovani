type UploadConfig = {
  region: string;
  bucket: string;
  publicBaseUrl: string;
};

export function getUploadConfig(): UploadConfig {
  const region = process.env.AWS_REGION ?? "";
  const bucket = process.env.S3_UPLOADS_BUCKET ?? "";
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL ?? "";

  if (!region || !bucket || !publicBaseUrl) {
    throw new Error(
      "Missing AWS_REGION, S3_UPLOADS_BUCKET, or S3_PUBLIC_BASE_URL environment variables.",
    );
  }

  return {
    region,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
  };
}
