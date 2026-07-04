import type { ConfigService } from '@nestjs/config';

export type ObjectStorageConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string | null;
  publicUrl: string;
};

export function isObjectStorageEnabled(config: ConfigService): boolean {
  return getObjectStorageConfig(config) !== null;
}

export function getObjectStorageConfig(
  config: ConfigService,
): ObjectStorageConfig | null {
  const bucket = config.get<string>('S3_BUCKET')?.trim();
  const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID')?.trim();
  const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY')?.trim();
  const publicUrl = config.get<string>('S3_PUBLIC_URL')?.trim();

  if (!bucket || !accessKeyId || !secretAccessKey || !publicUrl) {
    return null;
  }

  const region = config.get<string>('S3_REGION')?.trim() || 'auto';
  const endpoint = config.get<string>('S3_ENDPOINT')?.trim() || null;

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    publicUrl: publicUrl.replace(/\/+$/, ''),
  };
}
