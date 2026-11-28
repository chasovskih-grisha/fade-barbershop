import Link from 'next/link';

// Перехід між сторінками стрічки (T-2300e). Посилання звичайні, тож `q`
// переживає перезавантаження і «назад» браузера.

const linkClass =
  'inline-flex h-11 min-w-11 items-center justify-center rounded-input border border-line bg-surface px-5 text-body text-fg hover:border-line-strong transition-colors';

export function BlogPagination({
  prevHref,
  nextHref,
}: {
  prevHref: string | null;
  nextHref: string | null;
}) {
  if (!prevHref && !nextHref) return null;
  return (
    <nav
      aria-label="Сторінки стрічки блогу"
      className="flex items-center justify-between gap-4 border-t border-line pt-8"
    >
      {prevHref ? (
        <Link href={prevHref} rel="prev" className={linkClass}>
          &larr; Новіші
        </Link>
      ) : (
        <span />
      )}
      {nextHref ? (
        <Link href={nextHref} rel="next" className={linkClass}>
          Старіші &rarr;
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
