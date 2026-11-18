'use client';

// Пагінація списку клієнтів (docs/admin/16-shared.md §Pagination): «Назад/Далі»
// і живий лічильник сторінок; при одній сторінці — без панелі.
import { Button } from '@fade/ui';

export function ClientsPagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Сторінки списку клієнтів" className="mt-4 flex items-center gap-3">
      <Button variant="secondary" size="md" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Назад
      </Button>
      <p aria-live="polite" className="text-body text-fg-secondary">
        Сторінка {page} з {pages}
      </p>
      <Button
        variant="secondary"
        size="md"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Далі
      </Button>
    </nav>
  );
}
