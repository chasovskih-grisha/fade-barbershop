'use client';

// Таблиця барберів: фільтр статусу (активні/неактивні) + сортування по
// імені/телефону/статусу — клієнтська фільтрація по завантаженому списку.
import { useState } from 'react';
import { Button, StatusPill, TBody, TD, TH, THead, TR, Table } from '@fade/ui';
import { SortableTh } from '../components/SortableTh';
import { FilterSelect } from '../components/FilterSelect';
import { useColumnSort, sortRows } from '../components/use-column-sort';

type Barber = {
  id: string;
  name: string | null;
  phone: string;
  active: boolean;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'inactive', label: 'Неактивні' },
];

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

  const VALUE: Record<string, (barber: Barber) => unknown> = {
    name: (barber) => barber.name,
    phone: (barber) => barber.phone,
    status: (barber) => (barber.active ? 0 : 1),
  };
  const filtered = barbers.filter(
    (barber) => status === 'all' || (status === 'active') === barber.active
  );
  const rows = sortRows(filtered, sort, (barber) => VALUE[sort.key]?.(barber));

  return (
    <>
      <div className="mt-4">
        <FilterSelect label="Статус" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
      </div>
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
            <TR key={barber.id} data-selected={selected === barber.id}>
              <TD className="font-medium">{barber.name ?? '—'}</TD>
              <TD className="tabular-nums text-fg-secondary">{barber.phone}</TD>
              <TD>
                <StatusPill
                  status={barber.active ? 'completed' : 'cancelled'}
                  label={barber.active ? 'Активний' : 'Неактивний'}
                />
              </TD>
              <TD>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={barber.active ? 'ghost' : 'secondary'}
                    size="md"
                    onClick={() => void onToggle(barber)}
                  >
                    {barber.active ? 'Деактивувати' : 'Активувати'}
                  </Button>
                  <Button
                    variant={selected === barber.id ? 'secondary' : 'ghost'}
                    size="md"
                    onClick={() => onSelect(selected === barber.id ? '' : barber.id)}
                  >
                    Графік і локації
                  </Button>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
