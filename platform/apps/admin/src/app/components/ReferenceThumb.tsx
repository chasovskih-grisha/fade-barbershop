'use client';

// Мініатюра референсу зачіски (REF-ADM-01, admin-screens §5.2): підписаний URL
// з адмін-ендпоинта, клік розгортає фото на повний розмір. Честні стани без
// падінь: «Завантаження…» і «Фото недоступне» замість зламаного зображення.
//
// Єдиний рендерер фото в адмінці: і сітка календаря (`VisitCard`), і картка
// візиту (`BookingReferenceCard`) малюють мініатюру через нього — другий
// компонент зі своїм `<Image>` розійшовся б у станах і підписах.
// `presignedUrl` приходить із сітки календаря (REF-ADM-01): якщо він є, картка
// не робить власного запиту. Прострочений підпис (TTL 15 хв) ловить onError —
// один фолбек-запит за ID, без циклу.
import { useState } from 'react';
import Image from 'next/image';
import { useBookingReferencePhoto } from './use-reference-photo';

const THUMB = 'h-16 w-16 rounded-input object-cover';
const FULL = 'max-h-96 rounded-input object-contain';

export function ReferenceThumb({
  referenceId,
  presignedUrl = null,
}: {
  referenceId: string | null;
  presignedUrl?: string | null;
}) {
  const [full, setFull] = useState(false);
  const { url, loading, retry } = useBookingReferencePhoto(referenceId, presignedUrl);

  if (!referenceId) return null;
  if (!url) {
    return (
      <span className="text-body text-fg-muted">
        {loading ? 'Завантаження…' : 'Фото недоступне'}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setFull((value) => !value)}
      aria-label="Референс зачіски"
      aria-pressed={full}
      className="shrink-0"
    >
      {/* unoptimized: підписаний S3-URL має жити як є — оптимізатор його не проксіює. */}
      <Image
        src={url}
        alt="Референс зачіски"
        width={384}
        height={384}
        unoptimized
        // Фолбек лише для підпису з сітки: свій URL уже свіжий.
        onError={url === presignedUrl ? retry : undefined}
        className={full ? FULL : THUMB}
      />
    </button>
  );
}

// Договір делегування: хоча б одна адмінська поверхня має імпортувати цей тип
// на тому ж шляху, що й компонент, щоб видалення делегування ReferenceThumb
// відразу провалювало компіляцію, а не лише деякі runtime-перевірки.
export type _BookingReferenceCardMustImportReferenceThumb = typeof ReferenceThumb;
/**,_BookingReferenceCardMustImportReferenceThumb as _*/
