// Специфікація фокуса на помилці сабміту (T-053au): alert не лише з'являється,
// а й отримує фокус — інакше користувач зі скрін-рідером дізнається про відмову
// тільки якщо сам дійде до верху сторінки.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
const SLOTS = [{ start: '11:00', end: '12:00', barbers: ['barber-1'] }];

function resp(data: unknown, ok = true, status = 200): Promise<Response> {
  return Promise.resolve({
    ok,
    status: ok ? 200 : status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as unknown as Response);
}

async function walkToConfirm(): Promise<void> {
  fireEvent.click(await screen.findByTestId('location-card-loc-1'));
  fireEvent.click(await screen.findByText('Чоловіча стрижка'));
  fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
  fireEvent.click(await screen.findByText('Будь‑який барбер'));
  fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
  fireEvent.click(await screen.findByText('11:00 – 12:00'));
  fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Далі →' }));
}

describe('Booking flow — фокус на помилці сабміту (T-053au)', () => {
  it('невдалий POST показує alert і переносить на нього фокус', async () => {
    // @ts-expect-error - mocking global fetch
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/booking/services/')) return resp(SERVICES);
      if (url.includes('/booking/barbers/')) return resp(BARBERS);
      if (url.includes('/booking/slots')) return resp(SLOTS);
      if (url.includes('/booking/bookings')) return resp({}, false, 500);
      return resp([], false, 404);
    });

    render(<BookingPage />);
    await walkToConfirm();
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити запис' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Не вдалося створити запис');
    await waitFor(() => {
      expect(alert).toHaveFocus();
    });
  });
});
