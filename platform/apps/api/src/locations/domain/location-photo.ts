// Фото галереї сторінки локації (web-screens §2). Публічна галерея локації —
// адмін-керований список URL (модерація на вході); сирі фото клієнтів живуть
// у `portfolio` (AC 15), сюди потрапляють лише опубліковані посилання.

export interface PhotoData {
  url: string;
  caption: string | null;
  sortOrder: number;
}

export const PHOTOS_LIMIT = 30;
const URL_MAX = 500;
const CAPTION_MAX = 200;

/** Валідує одне фото; кидає Error з людиною-зрозумілим повідомленням. */
export function normalizePhoto(url: string, caption: string | null, sortOrder: number): PhotoData {
  const trimmed = url.trim();
  if (!/^https?:\/\/\S+$/.test(trimmed) || trimmed.length > URL_MAX) {
    throw new Error('Photo URL must be an http(s) URL (≤ 500 chars)');
  }
  const cleanCaption = caption?.trim() ?? null;
  if (cleanCaption && cleanCaption.length > CAPTION_MAX) {
    throw new Error(`Caption must be ≤ ${CAPTION_MAX} characters`);
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error('sortOrder must be a non-negative integer');
  }
  return { url: trimmed, caption: cleanCaption || null, sortOrder };
}

/** Будує список фото: валідація кожного, ліміт. */
export function normalizePhotos(
  inputs: readonly { url: string; caption?: string | null; sortOrder?: number }[]
): PhotoData[] {
  if (inputs.length > PHOTOS_LIMIT) throw new Error(`At most ${PHOTOS_LIMIT} photos`);
  return inputs.map((input, index) =>
    normalizePhoto(input.url, input.caption ?? null, input.sortOrder ?? index)
  );
}
