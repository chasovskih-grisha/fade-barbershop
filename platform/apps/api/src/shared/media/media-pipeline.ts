// Конвеєр публічного медіа (T-4609a): rotate(EXIF) → resize/cover → WebP.
// Чиста функція без S3 — тестується без мережі; адаптер лише зберігає результат.
// SVG растерізується: на публічному бакеті не зберігається виконуваний вектор.
import sharp from 'sharp';
import { MediaProcessingError } from './public-media-storage';

export interface MediaResize {
  width?: number;
  height?: number;
  fit?: 'inside' | 'cover';
}

export const DEFAULT_MEDIA_RESIZE: MediaResize = { width: 1024, height: 1024, fit: 'inside' };

export async function toWebp(
  bytes: Uint8Array,
  resize: MediaResize = DEFAULT_MEDIA_RESIZE
): Promise<Buffer> {
  if (bytes.byteLength === 0) throw new MediaProcessingError('empty media');
  try {
    return await sharp(Buffer.from(bytes))
      .rotate()
      .resize({ ...resize, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (error) {
    throw new MediaProcessingError(error instanceof Error ? error.message : undefined);
  }
}
