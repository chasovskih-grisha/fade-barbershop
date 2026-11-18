// Живе оновлення дашборда (T-045): подія релея перечитує день — порожній ранок
// наповнюється новим візитом у KPI і списку без перезавантаження.
import { act, render, screen, waitFor } from '@testing-library/react';
import AdminPage from './page';
import { FakeEventSource, installFakeEventSource } from './components/fake-event-source';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const visit = (id: string) => ({
  id,
  start: '2026-09-30T09:00:00.000Z',
  end: '2026-09-30T09:50:00.000Z',
  status: 'confirmed',
  barberId: 'b1',
  locationId: 'l1',
  agreedPrice: 750,
});

describe('AdminPage: живе оновлення (T-045)', () => {
  beforeEach(() => {
    FakeEventSource.reset();
    installFakeEventSource();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('на подію перечитує дані: новий візит з’являється без перезавантаження', async () => {
    const calendar = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ visits: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ visits: [visit('v-1')] }) });
    (global.fetch as jest.Mock).mockImplementation((input: string) => {
      if (input.startsWith('/admin/calendar')) return calendar();
      if (input.startsWith('/admin/barbers'))
        return Promise.resolve({ ok: true, json: async () => [{ id: 'b1', name: 'Остап' }] });
      if (input.startsWith('/admin/locations'))
        return Promise.resolve({ ok: true, json: async () => [{ id: 'l1', name: 'Сіті Лейк' }] });
      return Promise.resolve({ ok: false });
    });

    render(<AdminPage />);
    expect(await screen.findByText('На сьогодні візитів немає')).toBeInTheDocument();
    expect(calendar).toHaveBeenCalledTimes(1);

    act(() => FakeEventSource.only().emit('appointment'));

    await waitFor(() => expect(calendar).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Остап')).toBeInTheDocument();
    expect(await screen.findByText('750 ₴')).toBeInTheDocument();
  });
});
