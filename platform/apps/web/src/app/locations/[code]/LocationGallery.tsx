'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Photo } from '@/lib/api/locations';
import { LocationGalleryDialog } from './LocationGalleryDialog';

// T-4834a: сітка лишається сіткою, але фото тепер відкривається. Кнопка
// тримає фокус, діалог показує повний підпис і сусідні кадри, а порожній
// масив не малює ні заголовка, ні сітки.
export default function LocationGallery({ photos }: { photos: Photo[] }) {
  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sorted.length === 0) return null;
  return <GalleryGrid photos={sorted} />;
}

const thumbLabel = (photo: Photo) => photo.caption ?? `Фото локації ${photo.sortOrder + 1}`;

function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openers = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    const index = openIndex;
    setOpenIndex(null);
    if (index !== null) openers.current[index]?.focus();
  }, [openIndex]);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => (current === null ? null : (current + delta + photos.length) % photos.length));
    },
    [photos.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIndex, close]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-h4 font-semibold text-fg">Галерея</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {photos.map((photo, index) => (
          <figure key={photo.url} className="flex flex-col gap-2">
            <button
              type="button"
              ref={(node) => {
                openers.current[index] = node;
              }}
              aria-label={`Відкрити фото: ${thumbLabel(photo)}`}
              aria-haspopup="dialog"
              onClick={() => setOpenIndex(index)}
              className="group relative aspect-square w-full overflow-hidden rounded-[var(--radius-card)] border border-line-strong/60 bg-interactive text-left shadow-lg transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Image
                src={photo.url}
                alt={thumbLabel(photo)}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105 motion-reduce:transition-none"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzEzMTQxOCIvPjwvc3ZnPg=="
              />
            </button>
            {photo.caption && (
              <figcaption className="line-clamp-1 px-1 text-caption font-medium text-fg-secondary">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {openIndex !== null && photos[openIndex] && (
        <LocationGalleryDialog
          photo={photos[openIndex]}
          position={openIndex + 1}
          total={photos.length}
          onClose={close}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </section>
  );
}
