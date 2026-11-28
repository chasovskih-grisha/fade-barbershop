import { Skeleton } from '@fade/ui';

// Стан завантаження /locations/{code} (T-4513, T-4838): та сама ширина, що в
// готового плану візиту, — герой і два блоки, без фейкової карти чи ціни.
// Без спінера — скелет зберігає висоту контенту.

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-10 md:py-16">
      <section data-section="hero" className="flex flex-col gap-4">
        <Skeleton variant="text" className="h-4 w-40" />
        <Skeleton variant="rect" className="aspect-[16/9] w-full rounded-card" />
        <Skeleton variant="text" className="h-8 w-1/2" />
        <Skeleton variant="text" className="w-2/3" />
      </section>
      <Skeleton variant="rect" className="h-12 w-full" />
      <section className="flex flex-col gap-4">
        <Skeleton variant="text" className="h-6 w-1/3" />
        <Skeleton variant="rect" className="h-40 w-full" />
      </section>
      <section className="flex flex-col gap-4">
        <Skeleton variant="text" className="h-6 w-1/4" />
        <Skeleton variant="rect" className="h-32 w-full" />
      </section>
    </div>
  );
}
