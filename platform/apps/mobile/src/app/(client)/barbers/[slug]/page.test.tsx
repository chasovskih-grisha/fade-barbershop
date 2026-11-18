import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import BarberScreen from './page';
import * as locationsApi from '../../../../lib/api/locations';
import type { LocationDto } from '../../../../lib/api/locations';
import * as barbersApi from '../../../../lib/api/barbers';

// T-4850: повний публічний payload локації; порожні колекції — бо тест
// перевіряє лише майстра.
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
const mockUseLocalSearchParams = jest.fn(() => ({ slug: 'alex' }));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../../../lib/api/locations');
jest.mock('../../../../lib/api/barbers');

describe('BarberScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ slug: 'alex' });
  });

  it('renders barber name when found', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarberById').mockResolvedValueOnce({
      id: 'alex',
      name: 'Олександр',
      locationName: 'FADE Central',
    });

    render(<BarberScreen />);

    expect(screen.getByTestId('loading-skeleton')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('barber-name').props.children).toBe('Олександр');
      expect(screen.getByTestId('barber-location').props.children).toBe('FADE Central');
    });

    fireEvent.press(screen.getByTestId('back-button'));
    expect(mockPush).toHaveBeenCalledWith('/(client)/barbers');
  });

  it('handles unknown slug gracefully and offers directory', async () => {
    mockUseLocalSearchParams.mockReturnValue({ slug: 'unknown' });
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarberById').mockResolvedValueOnce(null);

    render(<BarberScreen />);

    await waitFor(() => {
      expect(screen.getByText('Майстра не знайдено')).toBeTruthy();
      expect(screen.getByText('До каталогу майстрів')).toBeTruthy();
    });
  });
});
