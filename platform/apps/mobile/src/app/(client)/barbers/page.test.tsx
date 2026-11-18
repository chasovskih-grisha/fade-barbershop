import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import BarbersDirectoryScreen from './page';
import * as locationsApi from '../../../lib/api/locations';
import type { LocationDto } from '../../../lib/api/locations';
import * as barbersApi from '../../../lib/api/barbers';

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
jest.mock('../../../lib/api/barbers');

describe('BarbersDirectoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list of barbers and navigates to barber screen on press', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarbers').mockResolvedValueOnce([
      { id: 'alex', name: 'Олександр', locationName: 'FADE Central' },
      { id: 'maksym', name: 'Максим', locationName: 'FADE Central' },
    ]);

    render(<BarbersDirectoryScreen />);

    expect(screen.getByTestId('loading-skeleton')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('directory-title').props.children).toBe('Наші майстри');
      expect(screen.getByTestId('barber-card-alex')).toBeTruthy();
      expect(screen.getByTestId('barber-card-maksym')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('barber-card-alex'));
    expect(mockPush).toHaveBeenCalledWith('/(client)/barbers/alex');
  });
});
