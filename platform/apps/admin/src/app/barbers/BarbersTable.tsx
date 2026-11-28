'use client';

// Таблиця барберів: фільтр статусу (активні/неактивні) + сортування по
// імені/телефону/статусу — клієнтська фільтрація по завантаженому списку.
import { useState } from 'react';
import { EmptyState, TBody, TH, THead, TR, Table } from '@fade/ui';
import { SortableTh } from '../components/SortableTh';
import { FilterSelect } from '../components/FilterSelect';
import { useColumnSort, sortRows } from '../components/use-column-sort';
import { BarberRow } from './BarberRow';
import type { Barber } from './BarberRow';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'inactive', label: 'Неактивні' },
];

const SORT_VALUE: Record<string, (barber: Barber) => unknown> = {
  name: (barber) => barber.name,
  phone: (barber) => barber.phone,
  status: (barber) => (barber.active ? 0 : 1),
};

export function BarbersTable({
  barbers,
  selected,
  onToggle,
  onSelect,
}: {
  barbers: Barber[];
  selected: string;
  onToggle: (barber: Barber) => void;
  onSelect: (id: string) => void;
}) {
  const { sort, onSort } = useColumnSort({ key: 'name', dir: 'asc' });
  const [status, setStatus] = useState('all');

  if (barbers.length === 0) {
    return (
      <EmptyState
        className="mt-4"
        title="Ще немає барберів"
        description="Додайте першого барбера формою вище — він з’явиться тут і в графіку."
      />
    );
  }

  const filtered = barbers.filter(
    (barber) => status === 'all' || (status === 'active') === barber.active
  );
  const rows = sortRows(filtered, sort, (barber) => SORT_VALUE[sort.key]?.(barber));

  return (
    <>
      <div className="mt-4">
        <FilterSelect label="Статус" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          className="mt-2"
          size="sm"
          title="Немає барберів із цим статусом"
          description="Змініть фільтр, щоб побачити решту списку."
        />
      ) : (
        <Table className="mt-2">
          <THead>
            <TR>
              <SortableTh column="name" label="Ім’я" sort={sort} onSort={onSort} />
              <SortableTh column="phone" label="Телефон" sort={sort} onSort={onSort} />
              <SortableTh column="status" label="Статус" sort={sort} onSort={onSort} />
              <TH>Керування</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((barber) => (
              <BarberRow
                key={barber.id}
                barber={barber}
                selected={selected}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
