import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  getObjectStorageConfig,
  isObjectStorageEnabled,
  normalizeGcsPublicObjectUrl,
  type ObjectStorageConfig,
} from './storage.config.js';

@Injectable()
export class ObjectStorageService {
  private readonly config: ObjectStorageConfig | null;
  private readonly client: S3Client | null;

  constructor(private readonly nestConfig: ConfigService) {
    this.config = getObjectStorageConfig(nestConfig);
    this.client =
      this.config !== null
        ? new S3Client({
            region: this.config.region,
            endpoint: this.config.endpoint ?? undefined,
            forcePathStyle: Boolean(this.config.endpoint),
            credentials: {
              accessKeyId: this.config.accessKeyId,
              secretAccessKey: this.config.secretAccessKey,
            },
          })
        : null;
  }

  isEnabled(): boolean {
    return isObjectStorageEnabled(this.nestConfig);
  }

  buildPublicUrl(key: string): string {
    if (!this.config) {
      throw new Error('Object storage non configuré');
    }
    return `${this.config.publicUrl}/${key.replace(/^\/+/, '')}`;
  }

  isManagedPublicUrl(url: string | null | undefined): boolean {
    if (!url || !this.config) return false;
    const normalized = this.normalizePublicObjectUrl(url);
    if (!normalized) return false;
    return normalized.startsWith(`${this.config.publicUrl}/`);
  }

  normalizePublicObjectUrl(url: string | null | undefined): string | null {
    if (!url || !this.config) return url ?? null;
    return normalizeGcsPublicObjectUrl(url, this.config.bucket);
  }

  async uploadObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('Object storage non configuré');
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        CacheControl:
          params.cacheControl ?? 'public, max-age=31536000, immutable',
      }),
    );

    return this.buildPublicUrl(params.key);
  }

  async deleteObjectByPublicUrl(url: string | null | undefined): Promise<void> {
    if (!this.client || !this.config || !url) return;
    const normalized = this.normalizePublicObjectUrl(url);
    if (!normalized || !this.isManagedPublicUrl(normalized)) return;

    const key = normalized.slice(this.config.publicUrl.length + 1);
    if (!key) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }
}
