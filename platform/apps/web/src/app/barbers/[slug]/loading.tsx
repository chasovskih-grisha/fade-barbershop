import { Skeleton } from '@fade/ui';
import { BarberBreadcrumb } from '../BarberBreadcrumb';

// Стан завантаження профілю майстра (T-4864): та сама ширина й колонка, що в
// `BarberDetailContent` (T-4860) — ланцюжок, портрет, блок імені й два регіони.
// Ніяких інших цифр і карток: гость бачить форму сторінки, яка прийде.
export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-container flex-col gap-8 px-4 py-10 pb-28 md:pb-10"
      data-testid="barber-profile-loading"
    >
      <BarberBreadcrumb />
      <div className="w-full max-w-md">
        <Skeleton variant="text" className="h-72 w-full rounded-card" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton variant="text" className="h-8 w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
      <Skeleton variant="text" className="h-32 w-full rounded-card" />
      <Skeleton variant="text" className="h-32 w-full rounded-card" />
    </div>
  );
}
