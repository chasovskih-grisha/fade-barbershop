import { render, screen, fireEvent } from '@testing-library/react';
import BookingPage from '../page';
import { type AvailableSlotDto, type BarberDto, type ServiceDto } from '../types';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../hooks/useNearestLocations', () => ({
  useNearestLocations: () => ({
    data: {
      city: null,
      sortedByDistance: false,
      locations: [
        {
          id: 'loc-1',
          code: 'LC',
          name: 'Сіті Лейк',
          address: 'вул. Тестова',
          phone: null,
          distanceKm: null,
        },
      ],
    },
    loading: false,
    error: false,
    status: 'idle',
    retryGeo: jest.fn(),
    clearGeo: jest.fn(),
    refresh: jest.fn(),
  }),
}));
jest.mock('../../components/GeoLocationBanner', () => () => null);

const SERVICES: ServiceDto[] = [
  { id: 'svc-1', name: 'Чоловіча стрижка', duration: 50, price: 600 },
];
const BARBERS: BarberDto[] = [
  { id: '', name: '', any: true },
  { id: 'barber-1', name: 'Олексій' },
];
// prettier-ignore
const SLOTS: AvailableSlotDto[] = [{ start: '11:00', end: '12:00', barbers: ['barber-1'] }, { start: '14:00', end: '15:00', barbers: [] }];

describe('Booking flow slots (T-041)', () => {
  beforeEach(() => {
    const createMockResponse = (data: unknown, ok = true, status = 200) => {
      return Promise.resolve({
        ok,
        status: ok ? 200 : 400,
        json: () => Promise.resolve(data),
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify(data)),
        clone: () => createMockResponse(data, ok, status),
      });
    };
    const route = (url: string) => {
      if (url.includes('/booking/services/')) return createMockResponse(SERVICES);
      if (url.includes('/booking/barbers/')) return createMockResponse(BARBERS);
      if (url.includes('/booking/slots')) return createMockResponse(SLOTS);
      if (url.includes('/booking/bookings')) return createMockResponse({ id: 'bk-9' });
      return createMockResponse({}, false, 400);
    };
    // @ts-expect-error - mocking global fetch
    global.fetch = jest.fn((url: string) => route(url));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('зайнятий слот disabled і не вибирається; ∅ стан на даті без слотів', async () => {
    render(<BookingPage />);
    fireEvent.click(await screen.findByTestId('location-card-loc-1'));
    fireEvent.click(await screen.findByText('Чоловіча стрижка'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    fireEvent.click(await screen.findByText('Олексій'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    const busy = await screen.findByText('14:00 – 15:00');
    expect((busy.closest('button') as HTMLButtonElement | null)?.className ?? '').toContain(
      'cursor-not-allowed'
    );
    fireEvent.click(busy);
    // prettier-ignore
    const next = screen.getByRole('button', { name: 'Далі' }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    const free = screen.getByRole('button', { name: '11:00 – 12:00' });
    fireEvent.click(free);
    expect(free.getAttribute('aria-pressed')).toBe('true');
    expect(free.className).toContain('bg-accent');
    expect(next.disabled).toBe(false);
    // prettier-ignore
    (global as unknown as { fetch: jest.Mock }).fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => [] }));
    const days = await screen.findAllByRole('tab');
    const day = days[5];
    if (day) fireEvent.click(day);
    await screen.findByText('На цю дату слотів немає');
  });
});
