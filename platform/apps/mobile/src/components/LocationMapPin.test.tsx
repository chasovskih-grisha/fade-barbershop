import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import LocationScreen from '../app/(client)/locations/[code]/page';
import * as locationsApi from '../lib/api/locations';
import type { LocationDto } from '../lib/api/locations';

// T-4835b: екран студії показує адресу й точку, а натиск віддає координати
// застосунку карт; вигаданих рядків про метро/парковку/каву немає.

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({ code: 'clt-01' }),
}));
jest.mock('../lib/api/locations');

const location: LocationDto = {
  id: '1',
  code: 'clt-01',
  name: 'FADE Central',
  address: 'Тепла, 5',
  addressParts: null,
  lat: 50.4523,
  lng: 30.5011,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
};

describe('Studio map pin (T-4835b)', () => {
  beforeEach(() => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([location]);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('передає збережені координати застосунку карт', async () => {
    render(<LocationScreen />);

    const pin = await screen.findByTestId('studio-map-pin');
    fireEvent.press(pin);

    await waitFor(() =>
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.openstreetmap.org/?mlat=50.4523&mlon=30.5011#map=17/50.4523/30.5011'
      )
    );
    expect(screen.getByTestId('studio-address').props.selectable).toBe(true);
  });

  it('не показує вигаданих рядків про маршрут', async () => {
    render(<LocationScreen />);
    await screen.findByTestId('studio-name');
    const text = JSON.stringify(screen.toJSON());
    for (const invented of ['метро', 'Парковка', 'кава']) {
      expect(text).not.toContain(invented);
    }
  });
});
