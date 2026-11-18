'use client';

// Сітка візитів календаря (T-045, T-4524): рядок = візит, клік → картка з
// діями, посилання в часі → деталі візиту /bookings/[uuid]. Сортування по
// колонках (use-column-sort). Перетягування (T-4524a) — рядок-джерело на
// рядок-ціль того самого барбера → той самий POST переносу, що й картка;
// клавіатура — стрілки рухають вибір, Enter/Space відкриває картку.
import { Table, THead, TBody, TR, TH } from '@fade/ui';
import { SortableTh } from '../components/SortableTh';
import { useColumnSort, sortRows } from '../components/use-column-sort';
import type { CalendarVisit } from './visit-status';
import { canDrag } from './drag-reschedule';
import { useVisitDrag } from './useVisitDrag';
import { nameOf, visitSortValue } from './visits-table.values';
import VisitRow from './VisitRow';

type Named = { id: string; name: string | null };

export default function VisitsTable(props: {
  visits: CalendarVisit[];
  locations: Named[];
  barbers: Named[];
  selectedId: string;
  onSelect: (id: string) => void;
  onRescheduled: () => void;
}) {
  const { visits, locations, barbers, selectedId, onSelect, onRescheduled } = props;
  const { sort, onSort } = useColumnSort({ key: 'start', dir: 'asc' });
  const drag = useVisitDrag(onRescheduled);
  const rows = sortRows(visits, sort, (visit) =>
    visitSortValue(sort.key, visit, { barbers, locations })
  );

  const onRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, visit: CalendarVisit) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(visit.id);
      return;
    }
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = rows[rows.findIndex((row) => row.id === visit.id) + step];
    if (next) onSelect(next.id);
  };

  return (
    <>
      {drag.error && (
        <p role="alert" className="mt-3 text-semantic-danger">
          {drag.error}
        </p>
      )}
      <Table className="mt-4">
        <THead>
          <TR>
            <SortableTh column="start" label="Час" sort={sort} onSort={onSort} />
            <SortableTh column="status" label="Статус" sort={sort} onSort={onSort} />
            <SortableTh column="barber" label="Барбер" sort={sort} onSort={onSort} />
            <SortableTh column="location" label="Локація" sort={sort} onSort={onSort} />
            <SortableTh column="price" label="Ціна" sort={sort} onSort={onSort} />
            <TH>Референс</TH>
            <TH>Деталі</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((visit) => (
            <VisitRow
              key={visit.bookingId}
              visit={visit}
              barberName={nameOf(barbers, visit.barberId)}
              locationName={nameOf(locations, visit.locationId)}
              selected={selectedId === visit.id}
              draggable={canDrag(visit)}
              dragging={drag.draggingId === visit.id}
              dropTarget={drag.canDrop(visit)}
              onSelect={onSelect}
              onKeyDown={onRowKeyDown}
              onDragStart={drag.start}
              onDragEnd={drag.end}
              onDragOver={(event, target) => {
                if (drag.canDrop(target)) event.preventDefault();
              }}
              onDrop={(event, target) => {
                event.preventDefault();
                void drag.drop(target);
              }}
            />
          ))}
        </TBody>
      </Table>
    </>
  );
}
