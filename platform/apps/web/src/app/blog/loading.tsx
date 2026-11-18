import { LocationListSkeleton } from '@/app/components/states/LocationListSkeleton';

// Скелет сторінки блогу під час SSR-запиту: форма стрічки, щоб не було
// спіннера (CLS). aria-hidden — скелет не несе змісту.

export default function BlogLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2">Блог</h1>
      </div>
      <LocationListSkeleton items={6} />
    </div>
  );
}
