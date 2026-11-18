// Фільтр статусу й сортування таблиці сьогоднішніх візитів дашборда.
import { render, screen, fireEvent } from '@testing-library/react';
import TodaysVisits from './dashboard-visits';

const barbers = [{ id: 'b1', name: 'Остап' }];
const locations = [{ id: 'l1', name: 'Поділ' }];

// prettier-ignore
const visits = [
  { id: 'v1', start: '2026-09-30T09:00:00.000Z', end: '2026-09-30T09:50:00.000Z', status: 'confirmed', barberId: 'b1', locationId: 'l1', agreedPrice: 750 },
  { id: 'v2', start: '2026-09-30T11:00:00.000Z', end: '2026-09-30T11:30:00.000Z', status: 'completed', barberId: 'b1', locationId: 'l1', agreedPrice: 500 },
];

const times = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent ?? '');

describe('TodaysVisits — фільтр статусу', () => {
  it('«Завершено» лишає лише завершені візити', () => {
    render(<TodaysVisits visits={visits} barbers={barbers} locations={locations} />);
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'completed' } });
    expect(times()).toHaveLength(1);
    expect(times()[0]).toContain('11:00–11:30');
    expect(screen.getByText('Показано: 1')).toBeInTheDocument();
  });

  it('порожній вибір статусу показує всі візити', () => {
    render(<TodaysVisits visits={visits} barbers={barbers} locations={locations} />);
    expect(times()).toHaveLength(2);
  });
});

describe('TodaysVisits — сортування', () => {
  it('клік по «Ціна» сортує asc за ціною', () => {
    render(<TodaysVisits visits={visits} barbers={barbers} locations={locations} />);
    fireEvent.click(screen.getByRole('button', { name: /Ціна/ }));
    expect(times()[0]).toContain('11:00–11:30'); // 500 перед 750
  });
});
