// Фільтр статусу й сортування таблиці барберів.
import { render, screen, fireEvent } from '@testing-library/react';
import { BarbersTable } from './BarbersTable';

// prettier-ignore
const barbers = [
  { id: 'b1', name: 'Олена', phone: '+380501111111', active: true },
  { id: 'b2', name: 'Іван', phone: '+380502222222', active: false },
  { id: 'b3', name: 'Анна', phone: '+380503333333', active: true },
];

function renderTable() {
  render(<BarbersTable barbers={barbers} selected="" onToggle={jest.fn()} onSelect={jest.fn()} />);
}

const names = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent ?? '');

describe('BarbersTable — фільтр статусу', () => {
  it('«Неактивні» лишає лише неактивних барберів', () => {
    renderTable();
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'inactive' } });
    expect(names()).toHaveLength(1);
    expect(names()[0]).toContain('Іван');
  });

  it('«Активні» лишає активних', () => {
    renderTable();
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'active' } });
    expect(names()).toHaveLength(2);
    expect(names().some((row) => row.includes('Іван'))).toBe(false);
  });
});

describe('BarbersTable — сортування', () => {
  it('дефолт asc за ім’ям; клік по «Статус» — активні першими', () => {
    renderTable();
    expect(names()[0]).toContain('Анна');

    fireEvent.click(screen.getByRole('button', { name: /Статус/ }));
    // asc: активні (0) перед неактивними (1), усередині — стабільний порядок.
    expect(names()[2]).toContain('Іван');
  });
});

describe('BarbersTable — порожній список', () => {
  it('без жодного барбера показує пояснення замість таблиці', () => {
    render(<BarbersTable barbers={[]} selected="" onToggle={jest.fn()} onSelect={jest.fn()} />);
    expect(screen.getByRole('region', { name: 'Ще немає барберів' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('фільтр без збігів пояснює, що список порожній', () => {
    render(
      <BarbersTable
        barbers={[{ id: 'b1', name: 'Олена', phone: '+380501111111', active: true }]}
        selected=""
        onToggle={jest.fn()}
        onSelect={jest.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'inactive' } });
    expect(
      screen.getByRole('region', { name: 'Немає барберів із цим статусом' })
    ).toBeInTheDocument();
  });
});
