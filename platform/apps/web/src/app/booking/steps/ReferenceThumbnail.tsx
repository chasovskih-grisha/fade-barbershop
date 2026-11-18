'use client';

// Мініатюра референсу на екрані підтвердження (T-043, REF-WEB-03).
// Фото лежить у приватному бакеті (ADR 0008 §2), тому беремо short-lived
// signed URL. Гість сесії не має (401) — тоді показуємо локальне data-URL
// прев'ю, яке вже є в пам'яті після завантаження.
import Image from 'next/image';
import { useReferencePhotoUrl } from './useReferencePhotoUrl';

export function ReferenceThumbnail({
  photoId,
  localPreview,
}: {
  photoId: string | null;
  localPreview: string | null;
}) {
  const signedUrl = useReferencePhotoUrl(photoId);

  const src = signedUrl ?? localPreview;
  if (!src) return null;

  return (
    <figure className="flex flex-col items-center gap-2">
      {/* unoptimized: підписаний S3-URL має жити як є (без проксі-оптимізатора). */}
      <Image
        src={src}
        alt="Референс зачіски"
        width={96}
        height={96}
        unoptimized
        className="w-24 h-24 rounded-input object-cover"
      />
      <figcaption className="text-sm text-fg-secondary">Референс зачіски</figcaption>
    </figure>
  );
}
