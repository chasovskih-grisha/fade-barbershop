import { render } from '@testing-library/react';
import VisitsTable from './VisitsTable';
import { visit } from './visit-card.fixture';

/** Два візити поспіль (10:00 і 12:00) — джерело й ціль перетягування. */
export const twoVisits = [
  visit(),
  visit({
    id: 'apt-2',
    bookingId: 'b-2',
    start: '2026-09-28T12:00:00.000Z',
    end: '2026-09-28T13:00:00.000Z',
  }),
];

export const rows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-visit-row]'));

export function renderTable(props: {
  visits?: ReturnType<typeof visit>[];
  barbers?: { id: string; name: string | null }[];
  onSelect?: (id: string) => void;
  onRescheduled?: () => void;
}): { container: HTMLElement } {
  return render(
    <VisitsTable
      visits={props.visits ?? twoVisits}
      locations={[{ id: 'loc-1', name: 'Сіті Лейк' }]}
      barbers={props.barbers ?? [{ id: 'barber-1', name: 'Іван' }]}
      selectedId=""
      onSelect={props.onSelect ?? jest.fn()}
      onRescheduled={props.onRescheduled ?? jest.fn()}
    />
  );
}
