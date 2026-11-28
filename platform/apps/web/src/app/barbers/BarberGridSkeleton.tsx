import { Skeleton } from '@fade/ui';

// Скелет сітки майстрів (T-4856): та сама сітка, що в `BarbersClient`
// (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), і той самий портретний кадр
// `aspect-[3/4]`, що в `BarberCard`, тож сітка не «стрибає», коли приходять дані.
// Це не скелет локацій: у локацій інша сітка й інший кадр фото.
// aria-hidden: скелет не несе змісту для скринридера.

export function BarberGridSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-2"
      data-testid="barbers-skeleton"
      aria-hidden="true"
    >
      {Array.from({ length: items }, (_, index) => (
        <div
          key={index}
          data-testid="barbers-skeleton-card"
          className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-md"
        >
          <Skeleton variant="rect" className="aspect-[3/4] w-full" />
          <div className="flex flex-col gap-4 p-6">
            <Skeleton variant="text" className="h-6 w-1/2" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
