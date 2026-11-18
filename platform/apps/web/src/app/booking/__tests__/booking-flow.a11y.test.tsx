// Специфікація анонсів і фокуса у флоу (T-053au/T-053av): скрін-рідер чує
// номер і назву кроку, а фокус переїжджає на вміст нового кроку, а не лишається
// на зниклій картці. При завантаженні сторінки фокус не перехоплюємо.
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookingPage from '../page';

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

const SERVICES = [{ id: 'svc-1', name: 'Чоловіча стрижка', duration: 50, price: 600 }];
const BARBERS = [
  { id: '', name: '', any: true },
  { id: 'barber-1', name: 'Олексій' },
];

function resp(data: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as unknown as Response);
}

describe('Booking flow — анонси кроків і фокус (T-053av)', () => {
  beforeEach(() => {
    // @ts-expect-error - mocking global fetch
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/booking/services/')) return resp(SERVICES);
      if (url.includes('/booking/barbers/')) return resp(BARBERS);
      return resp([]);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('перший крок анонсовано, але фокус при завантаженні не перехоплено', () => {
    render(<BookingPage />);
    expect(screen.getByText('Крок 1 з 7: Локація')).toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });

  it('перехід далі анонсує новий крок і переносить фокус у його вміст', async () => {
    render(<BookingPage />);
    fireEvent.click(await screen.findByTestId('location-card-loc-1'));
    expect(screen.getByText('Крок 2 з 7: Послуга')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByTestId('booking-step'));
  });
});
