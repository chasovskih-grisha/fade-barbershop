// Фото відгуку (T-150a, ADR 0015 §2): приватний бакет `feedback-photos`, до
// трьох файлів на відгук, лише jpg/png/webp і обмежений розмір. Публічного URL
// немає — показ тільки через короткоживучий підписаний.
import type { FeedbackWindowRecord } from './feedback-window';

export const FEEDBACK_PHOTO_BUCKET = 'feedback-photos';
export const MAX_FEEDBACK_PHOTOS = 3;
/** Той самий верхній ліміт, що й у підписувача S3: підпис не живе довше 15 хв. */
export const PHOTO_URL_TTL_SECONDS = 900;
export const MAX_FEEDBACK_PHOTO_BYTES = 5 * 1024 * 1024;

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedPhotoType = (typeof ALLOWED_PHOTO_TYPES)[number];

/** Посилання на об'єкт у бакеті; вміст відгуку не тримає байтів. */
export type FeedbackPhotoRef = { id: string; sortOrder: number };

export type StoredFeedbackPhoto = {
  objectKey: string;
  contentType: string;
  sizeBytes: number;
};

export class UnsupportedPhotoType extends Error {
  constructor(readonly contentType: string) {
    super(`Photo type ${contentType || 'unknown'} is not allowed`);
  }
}

export class PhotoTooLarge extends Error {
  constructor(readonly sizeBytes: number) {
    super(`Photo is larger than ${MAX_FEEDBACK_PHOTO_BYTES} bytes`);
  }
}

export class TooManyPhotos extends Error {
  constructor() {
    super(`At most ${MAX_FEEDBACK_PHOTOS} photos per review`);
  }
}

export class PhotoNotFound extends Error {
  constructor() {
    super('Photo not found in this review');
  }
}

export const isAllowedPhotoType = (value: string): value is AllowedPhotoType =>
  (ALLOWED_PHOTO_TYPES as readonly string[]).includes(value);

const MAGIC: Record<AllowedPhotoType, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

/** Оголошений тип має збігатися з підписом файлу, інакше це не те, за що його видають. */
export const contentMatchesType = (bytes: Uint8Array, contentType: string): boolean =>
  MAGIC[contentType as AllowedPhotoType].every((sig) => sig.every((b, i) => bytes[i] === b));

/** Тип, розмір і підпис перевіряються до запису в бакет: відмова не лишає сміття. */
export const assertPhotoAcceptable = (contentType: string, bytes: Uint8Array): void => {
  if (!isAllowedPhotoType(contentType)) throw new UnsupportedPhotoType(contentType);
  if (bytes.byteLength > MAX_FEEDBACK_PHOTO_BYTES) throw new PhotoTooLarge(bytes.byteLength);
  if (!contentMatchesType(bytes, contentType)) throw new UnsupportedPhotoType(contentType);
};

/** Посилання вікна у порядку показу; вміст лежить у бакеті. */
export const photoRefsOf = (record: FeedbackWindowRecord): FeedbackPhotoRef[] =>
  Array.isArray(record.photos) ? (record.photos as FeedbackPhotoRef[]) : [];

/** Відгук несе лише реально завантажені фото (T-150a): чужі id відкидаються. */
export const selectPhotos = (
  record: FeedbackWindowRecord,
  requested: string[]
): FeedbackPhotoRef[] => {
  const uploaded = photoRefsOf(record);
  if (requested.length === 0) return uploaded;
  return uploaded.filter((ref) => requested.includes(ref.id));
};

/** Той самий набір без одного фото, з перерахованим порядком. */
export const withoutPhoto = (
  refs: readonly FeedbackPhotoRef[],
  photoId: string
): FeedbackPhotoRef[] =>
  refs.filter((ref) => ref.id !== photoId).map((ref, sortOrder) => ({ ...ref, sortOrder }));
