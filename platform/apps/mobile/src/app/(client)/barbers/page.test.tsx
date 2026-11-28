import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import BarbersDirectoryScreen from './page';
import * as locationsApi from '../../../lib/api/locations';
import type { LocationDto } from '../../../lib/api/locations';
import * as barbersApi from '../../../lib/api/barbers';
import { barberHref, homeHref } from '../../../lib/routes';

// T-4850: локація тепер несе весь публічний payload; фікстура дає мінімум
// потрібних полів, а поля, які тест не перевіряє, лишаються порожніми.
const locationFixture = (overrides: Partial<LocationDto> = {}): LocationDto => ({
  id: 'loc-1',
  code: 'clt-01',
  name: 'FADE Central',
  address: 'Тепла, 5',
  addressParts: null,
  lat: 50.44,
  lng: 30.49,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
  ...overrides,
});

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../../../lib/api/locations');
// T-4865b: список фільтрує реальний listedBarbers, тож мокаємо лише запити.
jest.mock('../../../lib/api/barbers', () => {
  const actual = jest.requireActual('../../../lib/api/barbers');
  return { ...actual, fetchBarbers: jest.fn(), fetchBarberById: jest.fn() };
});

describe('BarbersDirectoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list of barbers and navigates to barber screen on press', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarbers').mockResolvedValueOnce([
      { id: 'alex', name: 'Олександр', locationName: 'FADE Central' },
      { id: 'maksym', name: 'Максим', locationName: 'FADE Central' },
      { id: 'petro', name: 'Петро', locationName: 'FADE Central', active: false },
    ]);

    render(<BarbersDirectoryScreen />);

    expect(screen.getByTestId('loading-skeleton')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('directory-title').props.children).toBe('Наші майстри');
      expect(screen.getByTestId('barber-card-alex')).toBeTruthy();
      expect(screen.getByTestId('barber-card-maksym')).toBeTruthy();
      // Вимкнений майстер у довіднику не показується (T-4865b).
      expect(screen.queryByTestId('barber-card-petro')).toBeNull();
    });

    fireEvent.press(screen.getByTestId('barber-card-alex'));
    expect(mockPush).toHaveBeenCalledWith(barberHref('alex'));

    fireEvent.press(screen.getByTestId('barber-card-maksym'));
    expect(mockPush).toHaveBeenCalledWith(barberHref('maksym'));
  });

  it('повертає з довідника на головну (T-4866)', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarbers').mockResolvedValueOnce([]);

    render(<BarbersDirectoryScreen />);

    await waitFor(() => expect(screen.getByTestId('no-barbers')).toBeTruthy());
    fireEvent.press(screen.getByTestId('back-home'));

    expect(mockPush).toHaveBeenCalledWith(homeHref());
  });

  it('групує довідник за студіями: два заголовки, спільний майстер один раз (T-4852b)', async () => {
    jest
      .spyOn(locationsApi, 'fetchLocations')
      .mockResolvedValueOnce([
        locationFixture({ id: 'loc-kyiv', code: 'KYI-01', name: 'Fade Kyiv' }),
        locationFixture({ id: 'loc-lviv', code: 'LVI-01', name: 'Fade Lviv' }),
      ]);
    jest
      .spyOn(barbersApi, 'fetchBarbers')
      .mockResolvedValueOnce([
        { id: 'taras', name: 'Тарас' },
        { id: 'ivan', name: 'Іван' },
      ])
      .mockResolvedValueOnce([
        { id: 'taras', name: 'Тарас' },
        { id: 'oleh', name: 'Олег' },
      ]);

    render(<BarbersDirectoryScreen />);

    await waitFor(() => expect(screen.getByTestId('studio-KYI-01')).toBeTruthy());
    expect(screen.getByTestId('studio-LVI-01')).toBeTruthy();
    expect(screen.getAllByTestId('barber-card-taras')).toHaveLength(1);
    expect(screen.getByTestId('barber-card-oleh')).toBeTruthy();
  });
});
