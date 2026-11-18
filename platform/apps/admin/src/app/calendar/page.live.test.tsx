// Живе оновлення календаря (T-045): подія релея перечитує сітку без
// перезавантаження сторінки — ключова вимога фічі.
import { act, render, waitFor } from '@testing-library/react';
import CalendarPage from './page';
import { FakeEventSource, installFakeEventSource } from '../components/fake-event-source';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const visit = (id: string) => ({
  id,
  bookingId: 'b-1',
  appointmentId: id,
  locationId: 'loc-1',
  barberId: 'barber-1',
  start: '2026-09-28T10:00:00.000Z',
  end: '2026-09-28T11:00:00.000Z',
  status: 'booked',
  serviceId: null,
  agreedPrice: 600,
  partyId: null,
  partyRole: null,
  haircutReferenceId: null,
  referencePhotoUrl: null,
  comment: null,
  source: 'web',
  clientId: null,
});

describe('CalendarPage: живе оновлення (T-045)', () => {
  beforeEach(() => {
    FakeEventSource.reset();
    installFakeEventSource();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('підписується на потік і перечитує календар на подію', async () => {
    const calendar = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ visits: [visit('apt-1')] }) });
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/admin/auth/me'))
        return Promise.resolve({ ok: true, json: async () => ({}) });
      if (url.startsWith('/admin/calendar')) return calendar();
      if (url.startsWith('/admin/locations'))
        return Promise.resolve({ ok: true, json: async () => [] });
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<CalendarPage />);
    await waitFor(() => expect(calendar).toHaveBeenCalledTimes(1));
    expect(FakeEventSource.only().url).toBe('/admin/live/events');

    act(() => FakeEventSource.only().emit('appointment'));

    await waitFor(() => expect(calendar).toHaveBeenCalledTimes(2));
  });
});
