// Регресія до збою оформлення: сторінка /booking падала на імпорті через
// module-level `useBookingFlow.getPersistedUtm()` — функції, якої не існує.
// UTM зберігає AnalyticsTracker (`persistUtmParams`), а воронка читає їх через
// `getStoredUtmParams()` усередині `bookingAnalytics.started`.
import { render, screen } from '@testing-library/react';
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

function resp(data: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as unknown as Response);
}

describe('Booking page — UTM атрибуція (регресія збою оформлення)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
    global.fetch = jest.fn(() => resp([])) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('монтує перший крок без module-level виклику хука', async () => {
    render(<BookingPage />);
    expect(await screen.findByText('Крок 1 з 7: Локація')).toBeInTheDocument();
  });

  it('додає збережені UTM до booking_started', async () => {
    localStorage.setItem(
      'fade_utm_params',
      JSON.stringify({ utm_source: 'instagram', utm_campaign: 'launch' })
    );

    render(<BookingPage />);

    expect(await screen.findByText('Крок 1 з 7: Локація')).toBeInTheDocument();
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'booking_started',
        entry_point: 'web_direct',
        utm_source: 'instagram',
        utm_campaign: 'launch',
      })
    );
  });

  it('працює без збережених UTM (прямий вхід)', async () => {
    render(<BookingPage />);

    expect(await screen.findByText('Крок 1 з 7: Локація')).toBeInTheDocument();
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({ event: 'booking_started', entry_point: 'web_direct' })
    );
  });
});
