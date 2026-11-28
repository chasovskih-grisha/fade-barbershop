import { Skeleton } from '@fade/ui';
import { BarberGridSkeleton } from './BarberGridSkeleton';

// Стан завантаження `/barbers` (T-4856): та сама ширина `max-w-container`, що в
// `BarbersClient`, герой тієї ж форми, що в `BarbersHeader`, і сітка портретних
// карток. Скелет локацій сюди не підходить — інша сітка й інший кадр фото.
// Блоків статистики, яких на сторінці вже немає, тут теж немає.

export default function Loading() {
  return (
    <div
      className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24"
      data-testid="barbers-loading"
    >
      <header className="flex flex-col gap-6 border-b border-line pb-12 rounded-card p-8 md:p-14">
        <Skeleton variant="text" className="h-10 w-1/2" />
        <Skeleton variant="text" className="w-2/3" />
      </header>
      <BarberGridSkeleton />
    </div>
  );
}
