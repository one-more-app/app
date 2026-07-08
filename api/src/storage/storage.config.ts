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
  let resolvedPublicUrl = publicUrl.replace(/\/+$/, '');

  if (
    endpoint?.includes('storage.googleapis.com') ||
    resolvedPublicUrl.includes('storage.googleapis.com')
  ) {
    resolvedPublicUrl = resolveGcsPublicUrl(bucket, resolvedPublicUrl);
  }

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    publicUrl: resolvedPublicUrl,
  };
}

/** GCS path-style public URLs must include the bucket segment. */
export function resolveGcsPublicUrl(
  bucket: string,
  publicUrl: string,
): string {
  const base = publicUrl.replace(/\/+$/, '');

  if (base.includes(`.storage.googleapis.com`)) {
    return base;
  }

  const pathStyleBase = `https://storage.googleapis.com/${bucket}`;
  if (base === 'https://storage.googleapis.com') {
    return pathStyleBase;
  }

  if (base.startsWith('https://storage.googleapis.com/')) {
    const path = base.slice('https://storage.googleapis.com/'.length);
    if (path === bucket || path.startsWith(`${bucket}/`)) {
      return base;
    }
    if (path.startsWith('avatars/')) {
      return `${pathStyleBase}/${path}`;
    }
    return pathStyleBase;
  }

  return base;
}

export function normalizeGcsPublicObjectUrl(
  url: string | null | undefined,
  bucket: string,
): string | null {
  if (!url) return null;

  const brokenPrefix = 'https://storage.googleapis.com/avatars/';
  const fixedPrefix = `https://storage.googleapis.com/${bucket}/avatars/`;
  if (url.startsWith(brokenPrefix)) {
    return url.replace(brokenPrefix, fixedPrefix);
  }

  return url;
}
