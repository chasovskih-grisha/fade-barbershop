'use client';

// Рядок сітки візитів (T-045/T-4524): клітинки часу/статусу/барбера/локації/
// ціни + посилання на деталі. Рядок — ціль перетягування (T-4524a): тягнеться
// мишею й доступний з клавіатури (фокус, Enter/Space — вибір, стрілки — сусідній
// рядок). Недоступні цілі позначені data-атрибутом, без hex/px.
import Link from 'next/link';
import { StatusPill, TD, TR, type VisitStatus } from '@fade/ui';
import type { CalendarVisit } from './visit-status';

export interface VisitRowProps {
  visit: CalendarVisit;
  barberName: string | null;
  locationName: string | null;
  selected: boolean;
  draggable: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onSelect: (id: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>, visit: CalendarVisit) => void;
  onDragStart: (visit: CalendarVisit) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLTableRowElement>, visit: CalendarVisit) => void;
  onDrop: (event: React.DragEvent<HTMLTableRowElement>, visit: CalendarVisit) => void;
}

export default function VisitRow(props: VisitRowProps) {
  const { visit, barberName, locationName, selected, draggable, dragging, dropTarget } = props;
  const { onSelect, onKeyDown, onDragStart, onDragEnd, onDragOver, onDrop } = props;
  return (
    <TR
      data-visit-row
      data-selected={selected}
      data-draggable={draggable}
      data-dragging={dragging}
      data-drop-target={dropTarget}
      tabIndex={0}
      className={`cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue${
        draggable ? ' cursor-grab' : ''
      }${dropTarget ? ' bg-surface-raised' : ''}${dragging ? ' opacity-50' : ''}`}
      aria-selected={selected}
      onClick={() => onSelect(visit.id)}
      onKeyDown={(event) => onKeyDown(event, visit)}
      draggable={draggable}
      onDragStart={() => onDragStart(visit)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, visit)}
      onDrop={(event) => onDrop(event, visit)}
    >
      <TD>{`${visit.start.slice(11, 16)}–${visit.end.slice(11, 16)}`}</TD>
      <TD>
        <StatusPill status={visit.status as VisitStatus} />
      </TD>
      <TD>{barberName ?? '—'}</TD>
      <TD>{locationName ?? '—'}</TD>
      <TD>{visit.agreedPrice !== null ? `${visit.agreedPrice} ₴` : '—'}</TD>
      <TD>{visit.haircutReferenceId ? 'є' : '—'}</TD>
      <TD>
        <Link
          href={`/bookings/${visit.bookingId}`}
          onClick={(event) => event.stopPropagation()}
          className="text-accent-blue hover:underline"
        >
          Відкрити
        </Link>
      </TD>
    </TR>
  );
}
