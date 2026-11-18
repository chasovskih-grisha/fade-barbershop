// In-memory PhotoStorage для функціональних тестів. Байти тримаємо окремо
// від метаданих, щоб read() міг віддати master-копію адаптеру генерації.

import type { PhotoStorage, StoredPhotoMeta } from '../domain/ports';

export class InMemoryStorage implements PhotoStorage {
  readonly objects = new Map<string, StoredPhotoMeta>();
  private readonly blobs = new Map<string, Uint8Array>();

  async put(input: {
    ownerId: string;
    contentType: string;
    bytes: Uint8Array;
  }): Promise<StoredPhotoMeta> {
    const objectKey = `${input.ownerId}/generated/${this.objects.size + 1}`;
    const meta: StoredPhotoMeta = {
      objectKey,
      bucket: 'haircut-ai-photos',
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
    };
    this.objects.set(objectKey, meta);
    this.blobs.set(objectKey, input.bytes);
    return meta;
  }

  async signedUrl(objectKey: string, ttlSeconds: number): Promise<string> {
    return `https://signed.test/${objectKey}?ttl=${ttlSeconds}`;
  }

  async remove(objectKeys: readonly string[]): Promise<void> {
    for (const key of objectKeys) {
      this.objects.delete(key);
      this.blobs.delete(key);
    }
  }

  async read(objectKey: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    const meta = this.objects.get(objectKey);
    const bytes = this.blobs.get(objectKey);
    if (!meta || !bytes) return null;
    return { bytes, contentType: meta.contentType };
  }
}
