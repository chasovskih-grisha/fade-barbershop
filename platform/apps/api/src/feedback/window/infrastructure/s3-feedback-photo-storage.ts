// MinIO/S3-адаптер фото відгуку (T-150a, ADR 0015 §2): приватний бакет
// `feedback-photos`, SSE за прапорцем (MinIO без KMS відхиляє заголовок),
// підпис із браузерного endpoint, бо всередині Docker хост інший.
import { Injectable } from '@nestjs/common';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { uuidv7 } from '@fade/domain-shared';
import { FEEDBACK_PHOTO_BUCKET, PHOTO_URL_TTL_SECONDS } from '../domain/feedback-photo';
import type { StoredFeedbackPhoto } from '../domain/feedback-photo';
import type { FeedbackPhotoStorage } from '../application/photo-port';

const DELETE_BATCH = 1000;

@Injectable()
export class S3FeedbackPhotoStorage implements FeedbackPhotoStorage {
  private readonly client: S3Client;
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
  }): Promise<StoredFeedbackPhoto> {
    const objectKey = `${input.ownerId}/feedback/${new Date().toISOString().slice(0, 10)}/${uuidv7()}`;
    const sse = process.env.S3_SSE === '1' ? 'AES256' : undefined;
    await this.client.send(
      new PutObjectCommand({
        Bucket: FEEDBACK_PHOTO_BUCKET,
        Key: objectKey,
        Body: input.bytes,
        ContentType: input.contentType,
        ...(sse ? { ServerSideEncryption: sse } : {}),
      })
    );
    return {
      objectKey,
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
    };
  }

  async signedUrl(objectKey: string, ttlSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: FEEDBACK_PHOTO_BUCKET, Key: objectKey });
    const expiresIn = Math.min(Math.max(ttlSeconds, 1), PHOTO_URL_TTL_SECONDS);
    return getSignedUrl(this.signer, command, { expiresIn });
  }

  async remove(objectKeys: readonly string[]): Promise<void> {
    for (let index = 0; index < objectKeys.length; index += DELETE_BATCH) {
      const batch = objectKeys.slice(index, index + DELETE_BATCH).map((Key) => ({ Key }));
      if (batch.length === 0) continue;
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: FEEDBACK_PHOTO_BUCKET,
          Delete: { Objects: batch, Quiet: true },
        })
      );
    }
  }
}
