// Підписаний URL фото референсу (T-043, REF-WEB-03; ADR 0008 §2). Бакет
// приватний, тож це єдиний спосіб показати фото клієнту. TTL короткий —
// тому не кешуємо URL у стані надовго.
import { apiBase } from './api-base';

/** Локальний файл, вибраний у галереї (expo-image-picker). */
export interface PickedPhoto {
  uri: string;
  name: string;
  type: string;
}

/**
 * Вивантаження власного референсу (REF-MOB-01, REF-WEB-05): той самий
 * multipart-маршрут, що й у web-флоу — поле `file`, ліміт 10 МБ (ADR 0015 §1).
 * Content-Type не ставимо: межа multipart формується рантаймом.
 */
export async function uploadReferencePhoto(file: PickedPhoto): Promise<string> {
  const body = new FormData();
  body.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  const res = await fetch(`${apiBase()}/booking/reference-photos`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `API ${res.status}`);
  }
  const data = (await res.json()) as { photoId?: string };
  if (!data.photoId) throw new Error('Сервер не повернув id фото');
  return data.photoId;
}

export async function getReferencePhotoUrl(photoId: string): Promise<string | null> {
  const res = await fetch(`${apiBase()}/booking/reference-photos/${encodeURIComponent(photoId)}`, {
    credentials: 'include',
  });
  // 401 — сесії немає (гість), 404 — не власник або фото видалено. В обох
  // випадках просто не показуємо фото, без помилки на екрані.
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}
