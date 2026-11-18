'use client';

// Заголовок колонки з сортуванням: кнопка + стрілка напряму, aria-sort для
// скрінрідерів. Використовує TH з @fade/ui, тож відступи як у решті таблиць.
import { TH } from '@fade/ui';
import type { SortState } from './use-column-sort';

export function SortableTh({
  column,
  label,
  sort,
  onSort,
}: {
  column: string;
  label: string;
  sort: SortState;
  onSort: (key: string) => void;
}) {
  const active = sort.key === column;
  return (
    <TH aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      >
        {label}
        <span aria-hidden className="text-caption">
          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </TH>
  );
}
