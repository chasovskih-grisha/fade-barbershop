import { Skeleton } from '@fade/ui';
import { LocationListSkeleton } from '@/app/components/states/LocationListSkeleton';

// Стан завантаження /locations (T-4513, T-4825): скелет тієї ж форми, що й
// результат — та сама ширина (`max-w-container`), герой і сітка карток, а не
// вузька текстова колонка; контент не «стрибає» (CLS).

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <header className="flex flex-col gap-6 border-b border-line pb-12 rounded-card p-8 md:p-14 bg-surface-raised/50">
        <Skeleton variant="text" className="h-10 w-1/2" />
        <Skeleton variant="text" className="w-2/3" />
      </header>
      <LocationListSkeleton />
    </div>
  );
}
