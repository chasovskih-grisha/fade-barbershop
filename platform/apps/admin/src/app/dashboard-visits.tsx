'use client';

// Таблиця сьогоднішніх візитів: час, статус, барбер, локація, ціна.
// Фільтр статусу + сортування по колонках — клієнтські, по завантаженому дні.
import { useState } from 'react';
import { Table, TBody, TD, THead, TR, StatusPill, formatMoney, type VisitStatus } from '@fade/ui';
import { SortableTh } from './components/SortableTh';
import { FilterSelect } from './components/FilterSelect';
import { useColumnSort, sortRows } from './components/use-column-sort';
import { STATUS_FILTER_OPTIONS, STATUS_ORDER } from './calendar/visit-status';
import type { CalendarVisitDto, DashboardData } from './types';

const hhmm = (iso: string) => iso.slice(11, 16);

export default function TodaysVisits({
  visits,
  barbers,
  locations,
}: {
  visits: CalendarVisitDto[];
  barbers: DashboardData['barbers'];
  locations: DashboardData['locations'];
}) {
  const { sort, onSort } = useColumnSort({ key: 'start', dir: 'asc' });
  const [status, setStatus] = useState('');

  const VALUE: Record<string, (visit: CalendarVisitDto) => unknown> = {
    start: (visit) => visit.start,
    status: (visit) => STATUS_ORDER[visit.status] ?? 99,
    barber: (visit) => barbers.find((barber) => barber.id === visit.barberId)?.name ?? null,
    location: (visit) =>
      locations.find((location) => location.id === visit.locationId)?.name ?? null,
    price: (visit) => visit.agreedPrice,
  };
  const filtered = visits.filter((visit) => !status || visit.status === status);
  const rows = sortRows(filtered, sort, (visit) => VALUE[sort.key]?.(visit));

  return (
    <>
      <div className="flex items-end justify-between gap-3 border-b border-line p-4">
        <FilterSelect
          label="Статус"
          value={status}
          options={STATUS_FILTER_OPTIONS}
          onChange={setStatus}
        />
        <p className="text-body text-fg-secondary">Показано: {rows.length}</p>
      </div>
      <Table>
        <THead>
          <TR>
            <SortableTh column="start" label="Час" sort={sort} onSort={onSort} />
            <SortableTh column="status" label="Статус" sort={sort} onSort={onSort} />
            <SortableTh column="barber" label="Барбер" sort={sort} onSort={onSort} />
            <SortableTh column="location" label="Локація" sort={sort} onSort={onSort} />
            <SortableTh column="price" label="Ціна" sort={sort} onSort={onSort} />
          </TR>
        </THead>
        <TBody>
          {rows.map((visit) => (
            <TR key={visit.id}>
              <TD>{`${hhmm(visit.start)}–${hhmm(visit.end)}`}</TD>
              <TD>
                <StatusPill status={visit.status as VisitStatus} />
              </TD>
              <TD>{barbers.find((barber) => barber.id === visit.barberId)?.name ?? '—'}</TD>
              <TD>{locations.find((location) => location.id === visit.locationId)?.name ?? '—'}</TD>
              <TD>{visit.agreedPrice !== null ? formatMoney(visit.agreedPrice) : '—'}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
