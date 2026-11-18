import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import LocationScreen from './page';
import * as locationsApi from '../../../../lib/api/locations';
import type { LocationDto } from '../../../../lib/api/locations';

// T-4850: повний публічний payload локації; порожні колекції — бо тест
// перевіряє назву й адресу.
const locationFixture = (overrides: Partial<LocationDto> = {}): LocationDto => ({
  id: '1',
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
const mockUseLocalSearchParams = jest.fn(() => ({ code: 'clt-01' }));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../../../lib/api/locations');

describe('LocationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ code: 'clt-01' });
  });

  it('renders studio name and address when location is found', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);

    render(<LocationScreen />);

    expect(screen.getByTestId('loading-skeleton')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('studio-name').props.children).toBe('FADE Central');
      expect(screen.getByTestId('studio-address').props.children).toBe('Тепла, 5');
    });
  });

  it('handles unknown location code gracefully', async () => {
    mockUseLocalSearchParams.mockReturnValue({ code: 'unknown' });
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);

    render(<LocationScreen />);

    await waitFor(() => {
      expect(screen.getByText('Студію не знайдено')).toBeTruthy();
    });
  });
});
