// Порт публічного медіа-сховища (T-4609a) — сестринський до PhotoStorage
// (T-043, haircut-ai), але для неперсональних зображень: логотипи локацій.
// ADR 0015/0008 не поширюються — публічні картинки не персональні дані, тому
// бакет публічний, URL стабільний і кешується, підписи не потрібні.

/** Дозволені вхідні типи; усе перетворюється у WebP перед збереженням. */
export const PUBLIC_MEDIA_INPUT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;
export type PublicMediaInputType = (typeof PUBLIC_MEDIA_INPUT_TYPES)[number];

/** Обробка зображення не вдалася (биті байти, непідтримуваний формат). */
export class MediaProcessingError extends Error {
  constructor(message = 'Media processing failed') {
    super(message);
    this.name = 'MediaProcessingError';
  }
}

export interface PublicMediaPut {
  bytes: Uint8Array;
  contentType: string;
  /** Ключ без розширення: `locations/{locationId}/{uuid}-light`. */
  key: string;
  /** Межі resize; fit cover = crop. Дефолт адаптера — 1024×1024 inside. */
  resize?: { width?: number; height?: number; fit?: 'inside' | 'cover' };
}

export interface PublicMediaObject {
  objectKey: string;
  /** Стабільний публічний URL для <img> (бакет віддає анонімно). */
  url: string;
  contentType: string;
  sizeBytes: number;
}

export interface PublicMediaStorage {
  put(input: PublicMediaPut): Promise<PublicMediaObject>;
  /** Ідемпотентне видалення (заміна логотипа лишає старі об'єкти). */
  remove(objectKeys: readonly string[]): Promise<void>;
  /** Стабільний публічний URL за ключем (база — з env адаптера). */
  publicUrl(objectKey: string): string;
}

/** DI-токен: застосунок залежить від інтерфейсу, не від S3-SDK. */
export const PUBLIC_MEDIA_STORAGE = Symbol('PUBLIC_MEDIA_STORAGE');
