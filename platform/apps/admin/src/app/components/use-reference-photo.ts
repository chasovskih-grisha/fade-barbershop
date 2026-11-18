'use client';

// Підписаний URL референсного фото (REF-BARBER, REF-ADM-01, T-043). Спільний
// для картки візиту /bookings/[uuid] і картки дня в календарі — обидві беруть
// його через `ReferenceThumb`, а не напряму.
// Адмін/барбер-поверхня: GET /admin/reference-photos/:id, охороняється
// глобальним AdminSessionGuard. Порожній referenceId — жодного запиту.
//
// Календар віддає URL разом із сіткою (`presignedUrl`), тож картка дня не
// робить N запитів — по одному на візит. Запит лишається фолбеком для тих
// поверхонь, що URL не отримують (картка /bookings/[uuid]), і для випадку,
// коли підпис із сітки вже прострочений (TTL 15 хв) — тоді `retry()`.
import { useCallback, useEffect, useState } from 'react';

export function useBookingReferencePhoto(
  referenceId: string | null,
  presignedUrl: string | null = null
): { url: string | null; loading: boolean; retry: () => void } {
  const [url, setUrl] = useState<string | null>(presignedUrl);
  const [loading, setLoading] = useState(false);
  // Після невдалого завантаження підписаного з сітки зображення (TTL) картка
  // переходить на власний запит; 0 — підпис із сітки ще не використано.
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (presignedUrl && attempt === 0) {
      setUrl(presignedUrl);
      setLoading(false);
      return;
    }
    if (!referenceId) {
      setUrl(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    void fetch(`/admin/reference-photos/${encodeURIComponent(referenceId)}`, {
      credentials: 'include',
    })
      .then(async (res) => (res.ok ? ((await res.json()) as { url?: string }) : null))
      .then((data) => {
        if (alive) setUrl(data?.url ?? null);
      })
      .catch(() => {
        if (alive) setUrl(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [referenceId, presignedUrl, attempt]);

  return { url, loading, retry };
}
