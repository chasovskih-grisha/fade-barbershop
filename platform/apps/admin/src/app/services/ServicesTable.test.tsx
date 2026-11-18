// Фільтр статусу й сортування таблиці послуг.
import { render, screen, fireEvent } from '@testing-library/react';
import { ServicesTable } from './ServicesTable';
import type { CatalogService } from './service-types';

// prettier-ignore
const services: CatalogService[] = [
  { id: 's1', name: 'Стрижка', description: null, category: null, duration: 30, parallelDuration: null, active: true, prices: [], locations: [] },
  { id: 's2', name: 'Гоління', description: null, category: null, duration: 20, parallelDuration: null, active: false, prices: [], locations: [] },
];

const noop = () => {};
const props = { locations: [], onError: noop, onReload: async () => {}, onSaved: noop };

const names = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => (row.querySelector('input')?.getAttribute('aria-label') ?? '').split(':')[0]);

describe('ServicesTable — фільтр статусу', () => {
  it('«Неактивні» лишає лише неактивні послуги', () => {
    render(<ServicesTable services={services} {...props} />);
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'inactive' } });
    expect(names()).toEqual(['Гоління']);
  });

  it('«Усі» показує каталог повністю', () => {
    render(<ServicesTable services={services} {...props} />);
    expect(names()).toHaveLength(2);
  });
});

describe('ServicesTable — сортування', () => {
  it('клік по «Послуга» перемикає asc → desc', () => {
    render(<ServicesTable services={services} {...props} />);
    expect(names()[0]).toBe('Гоління'); // asc: Гоління < Стрижка
    fireEvent.click(screen.getByRole('button', { name: /Послуга/ }));
    expect(names()[0]).toBe('Стрижка');
  });
});
