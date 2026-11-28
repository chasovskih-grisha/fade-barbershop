// T-4846: головна розрізняє три стани кожної секції. Тест іде через справжній
// хук `useStartupData` і справжній `IndexHome` — підмінені лише мережеві
// фетчери (fake-порт), тож повтор справді смикає `fetchLocations` ще раз.
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { IndexHome } from './index-home';
import { useStartupData } from '../lib/use-startup-data';
import { memoryStorage } from '../lib/cache-storage';
import * as locationsApi from '../lib/api/locations';
import * as catalogApi from '../lib/api/catalog';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../lib/api/locations', () => ({ fetchLocations: jest.fn() }));
jest.mock('../lib/api/catalog', () => ({ fetchServices: jest.fn() }));

const fetchLocations = locationsApi.fetchLocations as jest.Mock;
const fetchServices = catalogApi.fetchServices as jest.Mock;

const location = (id: string, name: string) => ({
  id,
  code: id,
  name,
  address: 'Тепла, 5',
  addressParts: null,
  lat: 0,
  lng: 0,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
});

const service = (id: string, name: string) => ({
  id,
  name,
  durationMinutes: 30,
  price: 300,
});

function Home() {
  const state = useStartupData(memoryStorage());
  return (
    <IndexHome
      stale={state.stale}
      locations={state.locations}
      services={state.services}
      onRetryLocations={state.retryLocations}
      onRetryServices={state.retryServices}
    />
  );
}

describe('Головна — три стани секцій (T-4846)', () => {
  beforeEach(() => {
    fetchLocations.mockReset();
    fetchServices.mockReset();
  });

  it('поки вантажиться — карткові скелети, а не слово «Завантаження...»', async () => {
    let resolveLocations: (value: unknown) => void = () => {};
    let resolveServices: (value: unknown) => void = () => {};
    fetchLocations.mockReturnValue(new Promise((resolve) => (resolveLocations = resolve)));
    fetchServices.mockReturnValue(new Promise((resolve) => (resolveServices = resolve)));

    const { getAllByTestId, getByTestId, queryByText } = render(<Home />);

    expect(getByTestId('home-cards-skeleton')).toBeTruthy();
    expect(getAllByTestId('home-cards-skeleton-card').length).toBeGreaterThanOrEqual(3);
    expect(getByTestId('home-rows-skeleton')).toBeTruthy();
    expect(queryByText(/Завантаження/)).toBeNull();

    // Дати singleFlight-обіцянкам завершитись, щоб вони не висіли для наступних тестів.
    await act(async () => {
      resolveLocations([]);
      resolveServices([]);
    });
  });

  it('порожні відповіді — по одному реченню на секцію', async () => {
    fetchLocations.mockResolvedValue([]);
    fetchServices.mockResolvedValue([]);

    const { getByTestId } = render(<Home />);

    await waitFor(() => expect(getByTestId('locations-empty')).toBeTruthy());
    expect(getByTestId('services-empty')).toBeTruthy();
  });

  it('падіння локацій не стирає послуги і не вдає порожнечу', async () => {
    fetchLocations.mockRejectedValue(new Error('offline'));
    fetchServices.mockResolvedValue([service('s1', 'Стрижка')]);

    const { getByTestId, getByText, queryByTestId } = render(<Home />);

    await waitFor(() => expect(getByTestId('locations-error')).toBeTruthy());
    expect(queryByTestId('locations-empty')).toBeNull();
    expect(getByText('Стрижка')).toBeTruthy();
    expect(queryByTestId('services-error')).toBeNull();
  });

  it('повтор локацій справді робить запит ще раз', async () => {
    fetchLocations.mockRejectedValueOnce(new Error('offline'));
    fetchServices.mockResolvedValue([]);

    const { getByTestId, queryByTestId } = render(<Home />);

    await waitFor(() => expect(getByTestId('locations-error')).toBeTruthy());
    expect(fetchLocations).toHaveBeenCalledTimes(1);

    fetchLocations.mockResolvedValueOnce([location('l1', 'Студія A')]);
    fireEvent.press(getByTestId('locations-error-retry'));

    await waitFor(() => expect(queryByTestId('locations-error')).toBeNull());
    expect(fetchLocations).toHaveBeenCalledTimes(2);
    expect(getByTestId('home-hero')).toBeTruthy();
  });
});
