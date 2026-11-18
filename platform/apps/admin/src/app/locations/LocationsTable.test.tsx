// Фільтр статусу й сортування таблиці локацій.
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationsTable } from './LocationsTable';

// prettier-ignore
const locations = [
  { id: 'l1', code: 'KYY-01', name: 'Поділ', address: 'вул. Хрещатик, 1', active: true },
  { id: 'l2', code: 'LVI-01', name: 'Центр', address: 'просп. Свободи, 2', active: false },
];

const codes = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent ?? '');

describe('LocationsTable — фільтр статусу', () => {
  it('«Неактивні» лишає лише неактивні локації', () => {
    render(<LocationsTable locations={locations} />);
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'inactive' } });
    expect(codes()).toHaveLength(1);
    expect(codes()[0]).toContain('LVI-01');
  });

  it('локація без поля active вважається активною', () => {
    render(
      <LocationsTable
        locations={[{ id: 'l3', code: 'ODO-01', name: 'Морвокзал', address: 'вул. Морська, 3' }]}
      />
    );
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'active' } });
    expect(codes()).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'inactive' } });
    expect(codes()).toHaveLength(0);
  });
});

describe('LocationsTable — сортування', () => {
  it('клік по «Код» перемикає asc → desc', () => {
    render(<LocationsTable locations={locations} />);
    expect(codes()[0]).toContain('KYY-01');
    fireEvent.click(screen.getByRole('button', { name: /Код/ }));
    expect(codes()[0]).toContain('LVI-01');
  });
});
