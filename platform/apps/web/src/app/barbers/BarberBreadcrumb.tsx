import Link from 'next/link';

// T-4863: один видимий ланцюжок для списку й профілю — «Головна / Майстри /
// імʼя». Список закінчується на «Майстри», профіль додає імʼя; поточна
// сторінка — текст, а не посилання. Розмітка — `nav` з доступним імʼям, як у
// ланцюжку локацій (T-4842).
export function BarberBreadcrumb({ current }: { current?: string }) {
  return (
    <nav aria-label="Навігаційний ланцюжок" className="text-caption text-fg-secondary">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition-colors hover:text-fg">
            Головна
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          {current ? (
            <Link href="/barbers" className="transition-colors hover:text-fg">
              Майстри
            </Link>
          ) : (
            <span aria-current="page">Майстри</span>
          )}
        </li>
        {current && (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <span aria-current="page">{current}</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
