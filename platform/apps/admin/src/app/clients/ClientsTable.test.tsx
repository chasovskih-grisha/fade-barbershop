// «Записати» підставляє `User.id` (`userId`), а не `ClientProfile.id` — див.
// `phone-booking-path.ts`. У фікстурах ці id навмисно різні: у сіді вони
// збігаються, тож живий прогін регресію «підставили профільний id» не показує.
//
// Сортування (T-4606a) КЕРОВАНЕ: таблиця викликає onSort і рендерить порядок
// від сервера — стан сортування живе в URL сторінки, не в таблиці.

import { render, screen, fireEvent } from '@testing-library/react';
import { ClientsTable } from './ClientsTable';
import { bookable, maria, anonymous, sortable } from './ClientsTable.fixtures';
import type { ClientListItem } from './client-list-types';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

function renderTable(
  clients: ClientListItem[],
  sort: { key: string; dir: 'asc' | 'desc' } = { key: 'name', dir: 'asc' }
) {
  const onSort = jest.fn();
  const onOpen = jest.fn();
  render(<ClientsTable clients={clients} sort={sort} onSort={onSort} onOpen={onOpen} />);
  return { onSort, onOpen };
}

describe('ClientsTable — кнопка «Записати»', () => {
  beforeEach(() => mockPush.mockReset());

  it('рендерить кнопку «Записати» поруч із «Відкрити»', () => {
    renderTable([bookable]);
    expect(screen.getByRole('button', { name: 'Відкрити' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Записати' })).toBeInTheDocument();
  });

  it('кнопка «Записати» веде на /bookings/phone з clientId і phone', () => {
    renderTable([maria]);
    fireEvent.click(screen.getByRole('button', { name: 'Записати' }));
    expect(mockPush).toHaveBeenCalledWith('/bookings/phone?clientId=u2&phone=%2B380671234567');
  });

  it('«Відкрити» викликає onOpen з профільним id, «Записати» — окремий маршрут', () => {
    const { onOpen } = renderTable([anonymous]);
    fireEvent.click(screen.getByRole('button', { name: 'Відкрити' }));
    expect(onOpen).toHaveBeenCalledWith('c3');
    fireEvent.click(screen.getByRole('button', { name: 'Записати' }));
    expect(mockPush).toHaveBeenCalledWith('/bookings/phone?clientId=u3&phone=%2B380509998877');
  });
});

describe('ClientsTable — сортування кероване (T-4606a)', () => {
  beforeEach(() => mockPush.mockReset());

  it('клік по заголовку викликає onSort з ключем колонки', () => {
    const { onSort } = renderTable([bookable]);
    fireEvent.click(screen.getByRole('button', { name: /Телефон/ }));
    expect(onSort).toHaveBeenCalledWith('phone');
    fireEvent.click(screen.getByRole('button', { name: /Останній візит/ }));
    expect(onSort).toHaveBeenCalledWith('lastVisit');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('aria-sort відповідає пропсу sort; неактивні колонки — none', () => {
    renderTable([bookable], { key: 'phone', dir: 'desc' });
    expect(screen.getByRole('columnheader', { name: /Телефон/ })).toHaveAttribute(
      'aria-sort',
      'descending'
    );
    expect(screen.getByRole('columnheader', { name: /Ім’я/ })).toHaveAttribute('aria-sort', 'none');
  });

  it('порядок рядків — від сервера: таблиця НЕ сортує сама', () => {
    renderTable(sortable, { key: 'name', dir: 'desc' });
    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent ?? '');
    expect(names[0]).toContain('Олена');
    expect(names[1]).toContain('Іван');
    expect(names[2]).toContain('Анна');
  });

  it('колонки §6.1: Візитів, Останній візит (DD.MM.YYYY), Лояльність X/7, VIP', () => {
    renderTable([bookable]);
    expect(screen.getByRole('columnheader', { name: /Візитів/ })).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // лічильник візитів
    expect(screen.getByText('01.10.2026')).toBeInTheDocument();
    expect(screen.getByText('4/7')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('клік по рядку відкриває картку клієнта', () => {
    const { onOpen } = renderTable([bookable]);
    const row = screen.getAllByRole('row')[1];
    fireEvent.click(row as HTMLElement);
    expect(onOpen).toHaveBeenCalledWith('c1');
  });
});
