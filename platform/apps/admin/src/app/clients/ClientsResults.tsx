'use client';

// Результат списку клієнтів (T-4606a): таблиця §6.1 + пагінація, або один із
// порожніх станів T-4516. Окремий компонент тримає розгалуження порожніх
// станів тут, а сторінка лишається пласкою (гейт complexity) і читається як
// «фільтри → підсумки → результат».
import { Button, EmptyState } from '@fade/ui';
import { ClientsPagination } from './ClientsPagination';
import { ClientsTable } from './ClientsTable';
import type { ClientListResult } from './client-list-types';
import type { ClientListState } from './client-list-query';

/** Дані ще не прийшли (перше завантаження або помилка) — результату немає. */
export function ClientsResults({
  data,
  sort,
  hasFilters,
  onSort,
  onPage,
  onReset,
  onOpen,
}: {
  data: ClientListResult | null;
  sort: ClientListState['sort'];
  hasFilters: boolean;
  onSort: (key: string) => void;
  onPage: (page: number) => void;
  onReset: () => void;
  onOpen: (id: string) => void;
}) {
  if (!data) return null;

  if (data.items.length === 0) {
    return hasFilters ? (
      <EmptyState
        title="За фільтрами нічого не знайдено"
        description="Змініть запит або зніміть фільтри — можливо, клієнт в іншій локації."
        action={
          <Button variant="secondary" size="md" onClick={onReset}>
            Скинути фільтри
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="Клієнтів ще немає"
        description="Клієнти з’являються після першого успішного OTP-входу."
      />
    );
  }

  return (
    <>
      <ClientsTable clients={data.items} sort={sort} onSort={onSort} onOpen={onOpen} />
      <ClientsPagination page={data.page} pages={data.pages} onPage={onPage} />
    </>
  );
}
