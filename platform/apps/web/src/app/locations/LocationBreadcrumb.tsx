import Link from 'next/link';

// T-4842: один ланцюжок для списку й сторінки студії — «Головна / Локації /
// назва». Список закінчується на «Локації», студія додає свою назву; поточна
// сторінка — текст, а не посилання. Розмітка — `nav` з доступним ім'ям,
// один рядок, що може переноситися над заголовком.

export function LocationBreadcrumb({ current }: { current?: string }) {
  return (
    <nav aria-label="Навігаційний ланцюжок" className="text-caption text-fg-secondary">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="hover:text-fg transition-colors">
            Головна
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          {current ? (
            <Link href="/locations" className="hover:text-fg transition-colors">
              Локації
            </Link>
          ) : (
            <span aria-current="page">Локації</span>
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
