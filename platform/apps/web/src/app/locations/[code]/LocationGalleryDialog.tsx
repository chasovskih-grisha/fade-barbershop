'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { Photo } from '@/lib/api/locations';

// T-4834a: діалог показує той самий кадр у повному кадрі (не квадрат), підпис
// без обрізання і «попереднє/наступне». Escape, backdrop і кнопка закриття
// ведуть до того самого фото, з якого діалог відкрили (фокус повертає сітка).
export function LocationGalleryDialog({
  photo,
  position,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  photo: Photo;
  position: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="gallery-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Фото ${position} з ${total}`}
        className="relative flex max-h-full w-full max-w-3xl flex-col gap-3 rounded-[var(--radius-card)] border border-line-strong/60 bg-surface-raised p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-caption text-fg-secondary">
            {position} / {total}
          </p>
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            className="rounded-md border border-line px-3 py-1 text-caption font-medium text-fg hover:border-accent"
          >
            Закрити
          </button>
        </div>

        <div className="relative mx-auto aspect-[3/2] w-full overflow-hidden rounded-[var(--radius-card)] bg-interactive">
          <Image
            src={photo.url}
            alt={photo.caption ?? `Фото локації ${photo.sortOrder + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
          />
        </div>

        {photo.caption && <p className="text-body text-fg">{photo.caption}</p>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-md border border-line px-4 py-2 text-body font-medium text-fg hover:border-accent"
          >
            Попереднє
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-md border border-line px-4 py-2 text-body font-medium text-fg hover:border-accent"
          >
            Наступне
          </button>
        </div>
      </div>
    </div>
  );
}
