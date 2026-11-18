// MinIO/S3-адаптер публічного медіа (T-4609a): бакет location-brand (окремо
// від приватних з T-001a), конвеєр — media-pipeline (sharp): rotate → resize →
// WebP. Стабільний публічний URL, кеш на рівні CDN/браузера (immutable).
import { Injectable } from '@nestjs/common';
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { toWebp } from './media-pipeline';
import type { PublicMediaObject, PublicMediaStorage } from './public-media-storage';

const BUCKET = 'location-brand';
const OUTPUT_TYPE = 'image/webp';
/** Ліміт DeleteObjects за один запит у S3 API. */
const DELETE_BATCH = 1000;

@Injectable()
export class S3PublicMediaStorage implements PublicMediaStorage {
  private readonly client: S3Client;
  private readonly publicBase: string;

  constructor() {
    const region = process.env.S3_REGION ?? 'us-east-1';
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== 'false';
    const credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
    };
    const internal = process.env.S3_ENDPOINT ?? 'http://localhost:19000';
    this.client = new S3Client({ region, endpoint: internal, forcePathStyle, credentials });
    // Браузер бачить інший хост, ніж Docker-мережа: localhost замість minio:9000.
    this.publicBase = (
      process.env.S3_PUBLIC_BASE_URL ??
      process.env.S3_PUBLIC_ENDPOINT ??
      internal
    ).replace(/\/$/, '');
  }

  async put(input: {
    bytes: Uint8Array;
    contentType: string;
    key: string;
    resize?: { width?: number; height?: number; fit?: 'inside' | 'cover' };
  }): Promise<PublicMediaObject> {
    const webp = await toWebp(input.bytes, input.resize);
    const objectKey = `${input.key}.webp`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
        Body: webp,
        ContentType: OUTPUT_TYPE,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    return {
      objectKey,
      url: `${this.publicBase}/${BUCKET}/${objectKey}`,
      contentType: OUTPUT_TYPE,
      sizeBytes: webp.byteLength,
    };
  }

  publicUrl(objectKey: string): string {
    return `${this.publicBase}/${BUCKET}/${objectKey}`;
  }

  /** Ідемпотентно; батчі по 1000 (ліміт S3 DeleteObjects). */
  async remove(objectKeys: readonly string[]): Promise<void> {
    for (let i = 0; i < objectKeys.length; i += DELETE_BATCH) {
      const batch = objectKeys.slice(i, i + DELETE_BATCH).map((Key) => ({ Key }));
      if (batch.length === 0) continue;
      await this.client.send(
        new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: batch, Quiet: true } })
      );
    }
  }
}
