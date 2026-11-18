// API референсних фото (T-043): завантаження через rewrite /booking/* → API
// (multipart FormData), відповідь — { photoId } для снепшоту в підтвердженні.

export async function uploadReferencePhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/booking/reference-photos', { method: 'POST', body: form });
  if (!res.ok) {
    const message = await res
      .json()
      .then((d: { message?: string }) => d.message)
      .catch(() => null);
    throw new Error(message ?? 'Не вдалося завантажити фото');
  }
  const data = (await res.json()) as { photoId: string };
  return data.photoId;
}

// Підписаний URL фото референсу (T-043, REF-WEB-03; ADR 0008 §2): бакет
// приватний, тож це єдиний спосіб показати фото клієнту. TTL короткий —
// тому не кешуємо URL у стані надовго.
export async function getReferencePhotoUrl(photoId: string): Promise<string | null> {
  const res = await fetch(`/booking/reference-photos/${encodeURIComponent(photoId)}`, {
    credentials: 'include',
  });
  // 401 — сесії немає (гість), 404 — не власник або фото видалено. В обох
  // випадках просто не показуємо фото, без помилки на екрані підтвердження.
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}
