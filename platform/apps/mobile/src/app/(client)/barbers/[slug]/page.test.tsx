import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import BarberScreen from './page';
import * as locationsApi from '../../../../lib/api/locations';
import * as barbersApi from '../../../../lib/api/barbers';
import { locationFixture } from './barber-page-fixtures';
import { barbersHref, bookingHref } from '../../../../lib/routes';
import { Share } from 'react-native';
import { barberProfileUrl } from '../../../../lib/share';

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
    expect(mockPush).toHaveBeenCalledWith(barbersHref());
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

  it('передає id майстра в наявний флоу запису і не малює кроків (T-4867)', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarberById').mockResolvedValueOnce({ id: 'alex', name: 'Олександр' });

    render(<BarberScreen />);

    await waitFor(() => expect(screen.getByTestId('barber-name')).toBeTruthy());
    fireEvent.press(screen.getByText('Записатися'));

    expect(mockPush).toHaveBeenCalledWith(bookingHref('alex'));
    expect(screen.queryByTestId('booking-step')).toBeNull();
  });

  it('shares the public profile link from the barber screen (T-4862b)', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarberById').mockResolvedValueOnce({ id: 'alex', name: 'Олександр' });

    render(<BarberScreen />);

    await waitFor(() => expect(screen.getByTestId('share-barber')).toBeTruthy());
    fireEvent.press(screen.getByTestId('share-barber'));

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: barberProfileUrl('alex') })
    );
    share.mockRestore();
  });

  it('explains an inactive barber and offers no book control (T-4865b)', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValueOnce([locationFixture()]);
    jest.spyOn(barbersApi, 'fetchBarberById').mockResolvedValueOnce({
      id: 'petro',
      name: 'Петро',
      active: false,
    });

    render(<BarberScreen />);

    await waitFor(() => expect(screen.getByTestId('barber-inactive')).toBeTruthy());
    expect(screen.getByText('Петро зараз не приймає записів')).toBeTruthy();
    expect(screen.queryByText('Записатися')).toBeNull();
    expect(screen.queryByTestId('barber-name')).toBeNull();

    fireEvent.press(screen.getByText('До каталогу майстрів'));
    expect(mockPush).toHaveBeenCalledWith(barbersHref());
  });
});
