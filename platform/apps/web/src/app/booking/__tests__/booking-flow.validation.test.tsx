import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
const SLOTS: AvailableSlotDto[] = [{ start: '11:00', end: '12:00', barbers: ['barber-1'] }];

describe('Quick Booking Form Validation (T-053au)', () => {
  const mkResp = (data: unknown, ok = true, status = 200) =>
    Promise.resolve({
      ok,
      status: ok ? 200 : status,
      json: () => Promise.resolve(data),
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(data)),
      clone: () => mkResp(data, ok, status),
    } as unknown as Response);

  beforeEach(() => {
    // @ts-expect-error - mocking global fetch
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/booking/services/')) return mkResp(SERVICES);
      if (url.includes('/booking/barbers/')) return mkResp(BARBERS);
      if (url.includes('/booking/slots')) return mkResp(SLOTS);
      if (url.includes('/booking/bookings')) return mkResp({ id: 'bk-9' });
      return mkResp({}, false, 400);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('показує реальний фідбек та блокує сабміт під час валідації або in-flight запиту', async () => {
    render(<BookingPage />);
    fireEvent.click(await screen.findByTestId('location-card-loc-1'));
    fireEvent.click(await screen.findByText('Чоловіча стрижка'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    fireEvent.click(await screen.findByText('Будь‑який барбер'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    const days = await screen.findAllByRole('tab');
    if (days[3]) fireEvent.click(days[3]);
    fireEvent.click(await screen.findByText('11:00 – 12:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    fireEvent.click(screen.getByRole('button', { name: 'Далі →' }));

    const textarea = screen.getByPlaceholderText('Коментар до зачіски…');
    expect(textarea).toHaveAttribute('maxLength', '500');
    expect(screen.getByText('0/500')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: 'Підтвердити запис' });
    expect(submitBtn).not.toBeDisabled();

    let resolvePost: (val: unknown) => void = () => {};
    const slowPromise = new Promise((res) => {
      resolvePost = res;
    });
    // @ts-expect-error - mocking fetch for slow post
    global.fetch = jest.fn((url: string) =>
      url.includes('/booking/bookings')
        ? slowPromise.then(() => mkResp({ id: 'bk-9' }))
        : mkResp([])
    );

    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Підтвердити запис' })).toBeDisabled();
    });
    resolvePost(true);
    await screen.findByText('Запис створено!', {}, { timeout: 5000 });
  });
});
