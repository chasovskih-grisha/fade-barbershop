import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import BarbersDirectoryScreen from './page';
import * as locationsApi from '../../../lib/api/locations';
import * as barbersApi from '../../../lib/api/barbers';
import type { LocationDto } from '../../../lib/api/locations';

// T-4868: завантаження, порожній payload і збій — три різні стани. Збій не
// сміє виглядати як «майстрів немає», і його можна повторити без виходу з
// довідника. Тест рендерить справжній екран і підмінює лише HTTP-клієнти.

const locationFixture = (): LocationDto => ({
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
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../lib/api/locations');
// T-4865b: екран застосовує реальний listedBarbers, тож мокаємо лише запити.
jest.mock('../../../lib/api/barbers', () => {
  const actual = jest.requireActual('../../../lib/api/barbers');
  return { ...actual, fetchBarbers: jest.fn(), fetchBarberById: jest.fn() };
});

describe('BarbersDirectoryScreen — стани довідника (T-4868)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('показує портретні скелети, поки триває запит', () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockReturnValue(new Promise(() => undefined));
    render(<BarbersDirectoryScreen />);

    expect(screen.getByTestId('loading-skeleton')).toBeTruthy();
    expect(screen.getAllByTestId('barber-skeleton-card')).toHaveLength(3);
    expect(screen.queryByTestId('no-barbers')).toBeNull();
    expect(screen.queryByTestId('barbers-error')).toBeNull();
  });

  it('порожній масив — одне речення, без помилки', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarbers').mockResolvedValueOnce([]);
    render(<BarbersDirectoryScreen />);

    await waitFor(() => expect(screen.getByTestId('no-barbers')).toBeTruthy());
    expect(screen.queryByTestId('barbers-error')).toBeNull();
    expect(screen.queryByTestId('loading-skeleton')).toBeNull();
  });

  it('збій запиту — речення про помилку й повтор, а не «майстрів немає»', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockRejectedValueOnce(new Error('offline'));
    render(<BarbersDirectoryScreen />);

    await waitFor(() => expect(screen.getByTestId('barbers-error')).toBeTruthy());
    expect(screen.queryByTestId('no-barbers')).toBeNull();
  });

  it('повтор після збою завантажує довідник', async () => {
    jest
      .spyOn(locationsApi, 'fetchLocations')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([locationFixture()]);
    jest
      .spyOn(barbersApi, 'fetchBarbers')
      .mockResolvedValueOnce([{ id: 'alex', name: 'Олександр', locationName: 'FADE Central' }]);
    render(<BarbersDirectoryScreen />);

    await waitFor(() => expect(screen.getByTestId('barbers-retry')).toBeTruthy());
    fireEvent.press(screen.getByTestId('barbers-retry'));

    await waitFor(() => expect(screen.getByTestId('barber-card-alex')).toBeTruthy());
    expect(screen.queryByTestId('barbers-error')).toBeNull();
  });

  it('збій запиту локацій — це помилка довідника, а не порожній список', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([]);
    render(<BarbersDirectoryScreen />);

    await waitFor(() => expect(screen.getByTestId('barbers-error')).toBeTruthy());
    expect(screen.queryByTestId('no-barbers')).toBeNull();
  });
});
