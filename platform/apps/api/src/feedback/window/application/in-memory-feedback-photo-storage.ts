// Памʼять замість S3 для функціональних тестів (T-150a): той самий порт, що й
// продакшн-адаптер, тож сценарії перевіряються через справжній сервіс.
import type { StoredFeedbackPhoto } from '../domain/feedback-photo';
import type { FeedbackPhotoStorage } from './photo-port';

export class InMemoryFeedbackPhotoStorage implements FeedbackPhotoStorage {
  readonly objects = new Map<string, StoredFeedbackPhoto>();
  readonly removed: string[] = [];
  private seq = 0;

  async put(input: {
    bytes: Uint8Array;
    contentType: string;
    ownerId: string;
  }): Promise<StoredFeedbackPhoto> {
    const objectKey = `${input.ownerId}/feedback/${++this.seq}`;
    const meta = {
      objectKey,
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
    };
    this.objects.set(objectKey, meta);
    return meta;
  }

  async signedUrl(objectKey: string, ttlSeconds: number): Promise<string> {
    return `https://signed.test/${objectKey}?ttl=${ttlSeconds}`;
  }

  async remove(objectKeys: readonly string[]): Promise<void> {
    for (const key of objectKeys) {
      this.objects.delete(key);
      this.removed.push(key);
    }
  }
}
