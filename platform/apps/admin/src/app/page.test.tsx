// Головна адмінки — живі дані календаря (KPI + сьогоднішні візити).
// Auth-гейт і shell живуть в AdminShell (root layout, покриття в AdminShell.test.tsx).
import { render, screen, waitFor } from '@testing-library/react';
import AdminPage from './page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const todayVisits = {
  visits: [
    {
      id: 'visit-1',
      start: '2026-09-30T09:00:00.000Z',
      end: '2026-09-30T09:50:00.000Z',
      status: 'confirmed',
      barberId: 'b1',
      locationId: 'l1',
      agreedPrice: 750,
    },
    {
      id: 'visit-2',
      start: '2026-09-30T11:00:00.000Z',
      end: '2026-09-30T11:30:00.000Z',
      status: 'completed',
      barberId: 'b1',
      locationId: 'l1',
      agreedPrice: 500,
    },
  ],
};

const barbers = [{ id: 'b1', name: 'Остап' }];
const locations = [{ id: 'l1', name: 'FADE Сіті Лейк' }];

function mockApis() {
  (global.fetch as jest.Mock).mockImplementation((input: string) => {
    const url = String(input);
    if (url.startsWith('/admin/calendar'))
      return Promise.resolve({ ok: true, json: async () => todayVisits });
    if (url.startsWith('/admin/barbers'))
      return Promise.resolve({ ok: true, json: async () => barbers });
    if (url.startsWith('/admin/locations'))
      return Promise.resolve({ ok: true, json: async () => locations });
    return Promise.resolve({ ok: false });
  });
}

describe('AdminPage (дашборд)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('показує KPI дня і сьогоднішні візити з іменами барберів і локацій', async () => {
    mockApis();
    render(<AdminPage />);

    // Ім’я і локація є в обох рядах; 500 ₴ — і в KPI, і в рядку завершеного візиту.
    expect((await screen.findAllByText('Остап')).length).toBe(2);
    expect(screen.getAllByText('FADE Сіті Лейк')).toHaveLength(2);
    // KPI: 2 візити, 1 очікується (confirmed), виторг лише завершені (500 ₴).
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByText('500 ₴')).toHaveLength(2);
  });

  it('порожній день → EmptyState, а не порожня таблиця', async () => {
    (global.fetch as jest.Mock).mockImplementation((input: string) => {
      const url = String(input);
      if (url.startsWith('/admin/calendar'))
        return Promise.resolve({ ok: true, json: async () => ({ visits: [] }) });
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    render(<AdminPage />);

    expect(await screen.findByText('На сьогодні візитів немає')).toBeInTheDocument();
  });

  it('помилка API → role="alert" з кнопкою оновлення', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    render(<AdminPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити дані');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Оновити' })).toBeInTheDocument()
    );
  });
});
