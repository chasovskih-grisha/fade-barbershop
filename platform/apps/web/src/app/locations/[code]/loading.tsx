import { Skeleton } from '@fade/ui';

// Стан завантаження /locations/{code} (T-4513): герой + два блоки, як на
// готовій сторінці. Без спінера — скелет зберігає висоту контенту.

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Skeleton variant="text" className="h-8 w-1/2" />
        <Skeleton variant="text" className="w-2/3" />
      </header>
      <Skeleton variant="rect" className="h-12 w-48" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton variant="rect" className="h-40" />
        <Skeleton variant="rect" className="h-40" />
      </div>
    </div>
  );
}
