// MinIO/S3-адаптер порта PhotoStorage (ADR 0008 §2): приватний бакет
// haircut-ai-photos, SSE-S3, ключі без читання вмісту запиту. Залежність
// @aws-sdk/client-s3 — єдина точка контакту з SDK; заміна сховища = новий адаптер.

import { Injectable } from '@nestjs/common';
import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { PhotoStorage, StoredPhotoMeta } from '../domain/ports';

const BUCKET = 'haircut-ai-photos';
/** Ліміт DeleteObjects за один запит у S3 API. */
const DELETE_BATCH = 1000;

@Injectable()
export class S3PhotoStorage implements PhotoStorage {
  private readonly client: S3Client;
  /** Підпис для браузера. Окремий endpoint, бо всередині Docker хост — minio:9000. */
  private readonly signer: S3Client;

  constructor() {
    const region = process.env.S3_REGION ?? 'us-east-1';
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== 'false';
    const credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
    };
    const internal = process.env.S3_ENDPOINT ?? 'http://localhost:19000';
    const make = (endpoint: string) =>
      new S3Client({ region, endpoint, forcePathStyle, credentials });
    this.client = make(internal);
    this.signer = make(process.env.S3_PUBLIC_ENDPOINT ?? internal);
  }

  async put(input: {
    bytes: Uint8Array;
    contentType: string;
    ownerId: string;
  }): Promise<StoredPhotoMeta> {
    const objectKey = `${input.ownerId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;
    // SSE-S3 (AES256) — для прод-провайдерів; MinIO без KMS відхиляє заголовок,
    // тому виставляється лише коли задано S3_SSE=1 (ADR 0008 §2: приватність —
    const sse = process.env.S3_SSE === '1' ? 'AES256' : undefined;
    await this.client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
        Body: input.bytes,
        ContentType: input.contentType,
        ...(sse ? { ServerSideEncryption: sse } : {}),
      })
    );
    return {
      objectKey,
      bucket: BUCKET,
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
    };
  }

  async signedUrl(objectKey: string, ttlSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: objectKey });
    // prettier-ignore
    return getSignedUrl(this.signer, command, { expiresIn: Math.min(Math.max(ttlSeconds, 1), 900) });
  }

  async read(objectKey: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    try {
      const out = await this.client.send(new GetObjectCommand({ Bucket: BUCKET, Key: objectKey }));
      const bytes = await out.Body?.transformToByteArray();
      if (!bytes) return null;
      return { bytes, contentType: out.ContentType ?? 'application/octet-stream' };
    } catch (error) {
      if (isMissingObject(error)) return null;
      throw error;
    }
  }

  /** Видалення об'єктів (AI-WEB-07): батчі по 1000 (ліміт S3); ідемпотентно. */
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

function isMissingObject(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) return false;
  return error.name === 'NoSuchKey' || error.name === 'NotFound';
}
