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

describe('Booking flow happy path (T-041)', () => {
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

  it('проходит 0→6: локація → послуга → будь-який → слот → зачіска → підтвердження', async () => {
    render(<BookingPage />);
    fireEvent.click(await screen.findByTestId('location-card-loc-1'));
    fireEvent.click(await screen.findByText('Чоловіча стрижка'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    fireEvent.click(await screen.findByText('Будь‑який барбер'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    const days = await screen.findAllByRole('tab');
    expect(days).toHaveLength(14);
    if (days[3]) fireEvent.click(days[3]);
    fireEvent.click(await screen.findByText('11:00 – 12:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    fireEvent.click(screen.getByRole('button', { name: 'Далі →' }));
    fireEvent.change(screen.getByPlaceholderText('Коментар до зачіски…'), {
      target: { value: 'зняти на 2 мм' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити запис' }));
    await screen.findByText('Запис створено!', {}, { timeout: 5000 });
    const calls = (global as unknown as { fetch: jest.Mock }).fetch.mock.calls as Array<
      [string, RequestInit?]
    >;
    const confirm = calls.find(([u]) => u === '/booking/bookings');
    if (!confirm) throw new Error('POST /booking/bookings не викликано');
    const body = JSON.parse(confirm[1]?.body as string) as Record<string, unknown>;
    // prettier-ignore
    expect(body).toMatchObject({ locationId: 'loc-1', serviceId: 'svc-1', start: '11:00', end: '12:00', reference: { appointmentComment: 'зняти на 2 мм' } });
    expect(body.serviceDuration).toBeUndefined();
    expect(body.source).toBeUndefined();
    expect(typeof body.date).toBe('string');
  });
});
