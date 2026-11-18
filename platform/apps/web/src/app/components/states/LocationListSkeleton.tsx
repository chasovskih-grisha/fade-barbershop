import { Skeleton } from '@fade/ui';

// Скелет списку локацій (T-4513, T-4825): `loading.tsx` і повторний запит
// показують форму майбутнього вмісту — сітка карток із фото-блоком, а не
// вузька текстова колонка, тож сторінка не «стрибає» (CLS), коли дані приходять.
// Та сама сітка (`grid-cols-1 md:grid-cols-2`), що й завантажений список, і той
// самий кадр фото `aspect-[4/5]`, що в `LocationCard`.
// aria-hidden: скелет не несе змісту для скринридера.

export function LocationListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2" data-testid="locations-skeleton">
      {Array.from({ length: items }, (_, index) => (
        <div
          key={index}
          data-testid="locations-skeleton-card"
          className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-md"
        >
          <div className="relative aspect-[4/5] w-full bg-surface-sunken" />
          <div className="flex flex-col gap-4 p-8">
            <Skeleton variant="text" className="h-6 w-1/2" />
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
