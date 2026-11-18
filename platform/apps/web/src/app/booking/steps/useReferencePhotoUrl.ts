'use client';

// Підписаний URL референсного фото (ADR 0008 §2: бакет приватний, тож єдиний
// спосіб показати фото — short-lived signed URL). Винесено з ReferenceThumbnail,
// бо той самий URL тепер потрібен і в «Моїх візитах» (REF-WEB-03).
import { useEffect, useState } from 'react';
import { getReferencePhotoUrl } from '../referencePhotoApi';

/**
 * `null` поки не прийшов або коли доступу немає. Мережа може впасти навіть
 * коли HTTP-статус ще невідомий — тож відхилення перехоплюємо, інакше воно
 * піднімається як unhandled rejection на екрані.
 */
export function useReferencePhotoUrl(photoId: string | null): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!photoId) {
      setSignedUrl(null);
      return;
    }
    void getReferencePhotoUrl(photoId)
      .then((url) => {
        if (alive) setSignedUrl(url);
      })
      .catch(() => {
        if (alive) setSignedUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [photoId]);

  return signedUrl;
}
