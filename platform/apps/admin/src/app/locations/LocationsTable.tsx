'use client';

// Таблиця локацій: фільтр статусу (активні/неактивні) + сортування по
// коду/назві/адресі. `active` у API опційний — відсутність означає активну.
import { useState } from 'react';
import Link from 'next/link';
import { Table, THead, TBody, TR, TH, TD, Badge } from '@fade/ui';
import { SortableTh } from '../components/SortableTh';
import { FilterSelect } from '../components/FilterSelect';
import { useColumnSort, sortRows } from '../components/use-column-sort';

interface Location {
  id: string;
  code: string;
  name: string;
  address: string;
  active?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'inactive', label: 'Неактивні' },
];

const isActive = (location: Location) => location.active !== false;

export function LocationsTable({ locations }: { locations: Location[] }) {
  const { sort, onSort } = useColumnSort({ key: 'code', dir: 'asc' });
  const [status, setStatus] = useState('all');

  const VALUE: Record<string, (location: Location) => unknown> = {
    code: (location) => location.code,
    name: (location) => location.name,
    address: (location) => location.address,
    status: (location) => (isActive(location) ? 0 : 1),
  };
  const filtered = locations.filter(
    (location) => status === 'all' || (status === 'active') === isActive(location)
  );
  const rows = sortRows(filtered, sort, (location) => VALUE[sort.key]?.(location));

  return (
    <>
      <div className="mt-4 flex items-end justify-between gap-3">
        <FilterSelect label="Статус" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <p className="text-body text-fg-secondary">Показано: {rows.length}</p>
      </div>
      <Table className="mt-2">
        <THead>
          <TR>
            <SortableTh column="code" label="Код" sort={sort} onSort={onSort} />
            <SortableTh column="name" label="Назва" sort={sort} onSort={onSort} />
            <SortableTh column="address" label="Адреса" sort={sort} onSort={onSort} />
            <SortableTh column="status" label="Статус" sort={sort} onSort={onSort} />
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((loc) => (
            <TR key={loc.id}>
              <TD>{loc.code}</TD>
              <TD>{loc.name}</TD>
              <TD>{loc.address}</TD>
              <TD>{!isActive(loc) && <Badge tone="neutral">Неактивна</Badge>}</TD>
              <TD>
                <Link href={`/locations/${loc.id}`} className="underline">
                  Редагувати
                </Link>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
