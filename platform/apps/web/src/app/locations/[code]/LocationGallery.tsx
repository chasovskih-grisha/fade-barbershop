import Image from 'next/image';
import type { Photo } from '@/lib/api/locations';

// Галерея локації (web-screens §2, розширення): сітка фото з підписами.
// Порядок — за sortOrder; пуста галерея не рендериться.

export default function LocationGallery({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;
  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <section aria-label="Галерея локації" className="flex flex-col gap-4">
      <h2 className="font-display text-h4 font-semibold text-fg">Галерея</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {sorted.map((photo) => (
          <figure key={photo.url} className="flex flex-col gap-2 group">
            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-card)] bg-interactive border border-line-strong/60 shadow-lg group-hover:border-accent group-hover:shadow-xl transition-all duration-300">
              <Image
                src={photo.url}
                alt={photo.caption ?? `Фото локації ${photo.sortOrder + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaXg9IjQwMCIgZmlsbD0iIzEzMTQxOCIvPjwvc3ZnPg=="
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            {photo.caption && (
              <figcaption className="text-caption text-fg-secondary font-medium px-1 line-clamp-1">{photo.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
