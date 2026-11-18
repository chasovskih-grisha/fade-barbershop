// Спільне сортування таблиць адмінки: стан колонки (asc → desc), напрямки,
// порожні значення наприкінці, aria-sort у заголовку.
import { render, screen, fireEvent } from '@testing-library/react';
import { useColumnSort, sortRows } from './use-column-sort';
import { SortableTh } from './SortableTh';

describe('useColumnSort', () => {
  function Probe() {
    const { sort, onSort } = useColumnSort({ key: 'name', dir: 'asc' });
    return (
      <table>
        <thead>
          <tr>
            <SortableTh column="name" label="Ім’я" sort={sort} onSort={onSort} />
            <SortableTh column="phone" label="Телефон" sort={sort} onSort={onSort} />
          </tr>
        </thead>
      </table>
    );
  }

  it('перший клік по іншій колонці — asc, повторний по тій самій — desc', () => {
    render(<Probe />);
    const phone = screen.getByRole('columnheader', { name: /Телефон/ });
    expect(phone).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(screen.getByRole('button', { name: /Телефон/ }));
    expect(phone).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: /Телефон/ }));
    expect(phone).toHaveAttribute('aria-sort', 'descending');
  });

  it('активна колонка має aria-sort, неактивна — «none»', () => {
    render(<Probe />);
    const name = screen.getByRole('columnheader', { name: /Ім’я/ });
    expect(name).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(screen.getByRole('button', { name: /Телефон/ }));
    expect(name).toHaveAttribute('aria-sort', 'none');
  });
});

describe('sortRows', () => {
  const rows = [
    { id: 'a', name: 'Олена', visits: 3 },
    { id: 'b', name: null as string | null, visits: 7 },
    { id: 'c', name: 'Іван', visits: 1 },
  ];

  it('asc/desc за рядком (uk-локаль) і за числом', () => {
    const byName = sortRows(rows, { key: 'name', dir: 'asc' }, (r) => r.name);
    expect(byName.map((r) => r.id)).toEqual(['c', 'a', 'b']);
    const byVisits = sortRows(rows, { key: 'visits', dir: 'desc' }, (r) => r.visits);
    expect(byVisits.map((r) => r.id)).toEqual(['b', 'a', 'c']);
  });

  it('порожні значення — наприкінці за обох напрямків, вхідний масив не мутується', () => {
    const asc = sortRows(rows, { key: 'name', dir: 'asc' }, (r) => r.name);
    expect(asc.at(-1)?.id).toBe('b');
    const desc = sortRows(rows, { key: 'name', dir: 'desc' }, (r) => r.name);
    expect(desc.at(-1)?.id).toBe('b');
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});
