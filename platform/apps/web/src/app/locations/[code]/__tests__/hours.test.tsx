import { render, screen, within } from '@testing-library/react';
import LocationHours from '../LocationHours';
import type { OpeningHour } from '@/lib/api/locations';

// T-4832a: сьогоднішній рядок — перший і позначений, решта шість днів
// лишається. Доменний індекс: 0 = понеділок … 6 = неділя, тому «сьогодні»
// тут — 2 (середа), а не Date.getDay().

const WEDNESDAY = new Date(2026, 10, 18, 12, 0, 0);

const week = (overrides: Partial<OpeningHour> = {}): OpeningHour[] =>
  [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    open: '10:00',
    close: '20:00',
    closed: false,
    ...overrides,
  }));

describe('LocationHours (T-4832a)', () => {
  it('marks Wednesday first when today is Wednesday and keeps the other six days', () => {
    render(<LocationHours hours={week()} now={WEDNESDAY} />);

    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows).toHaveLength(7);
    expect(rows[0]?.getAttribute('aria-current')).toBe('date');
    expect(rows[0]?.textContent).toContain('Ср · Сьогодні');
    expect(rows[0]?.textContent).toContain('10:00–20:00');
    expect(rows[1]?.textContent).toContain('Пн');
    expect(rows[1]?.getAttribute('aria-current')).toBeNull();
    const marked = rows.filter((row) => row.getAttribute('aria-current') === 'date');
    expect(marked).toHaveLength(1);
  });

  it('says «Вихідний» in the marked row when today is closed', () => {
    const hours = week().map((day) =>
      day.dayOfWeek === 2 ? { ...day, open: null, close: null, closed: true } : day
    );
    render(<LocationHours hours={hours} now={WEDNESDAY} />);

    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows[0]?.getAttribute('aria-current')).toBe('date');
    expect(rows[0]?.textContent).toContain('Вихідний');
    expect(rows[1]?.textContent).toContain('10:00–20:00');
  });

  it('shows the sentence instead of a blank card when there is no schedule', () => {
    render(<LocationHours hours={[]} now={WEDNESDAY} />);

    expect(screen.getByText('Графік ще не вказано')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
