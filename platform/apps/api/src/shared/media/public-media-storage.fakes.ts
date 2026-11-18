// Фейк публічного медіа-сховища (ADR 0019): юніт-тести use case і e2e-харнеси
// locations працюють без S3; контракт URL/ключів такий самий, як в адаптера.
import {
  MediaProcessingError,
  type PublicMediaObject,
  type PublicMediaStorage,
} from './public-media-storage';

export interface MemMediaObject {
  key: string;
  bytes: Uint8Array;
  sourceType: string;
}

export class MemPublicMediaStorage implements PublicMediaStorage {
  readonly objects = new Map<string, MemMediaObject>();

  async put(input: {
    bytes: Uint8Array;
    contentType: string;
    key: string;
    resize?: { width?: number; height?: number; fit?: 'inside' | 'cover' };
  }): Promise<PublicMediaObject> {
    if (input.bytes.byteLength === 0) throw new MediaProcessingError('empty media');
    const objectKey = `${input.key}.webp`;
    this.objects.set(objectKey, {
      key: objectKey,
      bytes: input.bytes,
      sourceType: input.contentType,
    });
    return {
      objectKey,
      url: `https://media.test/location-brand/${objectKey}`,
      contentType: 'image/webp',
      sizeBytes: input.bytes.byteLength,
    };
  }

  async remove(objectKeys: readonly string[]): Promise<void> {
    for (const key of objectKeys) this.objects.delete(key);
  }

  publicUrl(objectKey: string): string {
    return `https://media.test/location-brand/${objectKey}`;
  }
}
