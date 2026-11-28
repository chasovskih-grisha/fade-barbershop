import { render, screen } from '@testing-library/react';
import LocationStep from '../steps/LocationStep';
import { useNearestLocations } from '../../hooks/useNearestLocations';
import { BOOKING_OPENS_SOON_TEXT } from '@/lib/booking-availability';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('../../hooks/useNearestLocations', () => ({ useNearestLocations: jest.fn() }));

const useNearestLocationsMock = useNearestLocations as jest.Mock;

const baseHook = {
  loading: false,
  error: false,
  status: 'idle',
  retryGeo: jest.fn(),
  clearGeo: jest.fn(),
  refresh: jest.fn(),
};

describe('крок локації залежно від каталогу (T-4614e)', () => {
  it('порожній каталог: не відкриває вибір локації, а пояснює відкриття', () => {
    useNearestLocationsMock.mockReturnValue({
      ...baseHook,
      data: { city: null, sortedByDistance: false, locations: [] },
    });
    render(<LocationStep onSelect={() => {}} />);

    expect(screen.queryByRole('heading', { name: 'Оберіть локацію' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Запис ще не відкрито' })).toBeInTheDocument();
    expect(screen.getByText(BOOKING_OPENS_SOON_TEXT)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Де ми відкриємось' }).getAttribute('href')).toBe(
      '/locations'
    );
    expect(screen.getByRole('link', { name: 'Послуги та прайс' }).getAttribute('href')).toBe(
      '/services'
    );
    expect(document.querySelectorAll('a[href^="/booking"]')).toHaveLength(0);
  });

  it('активний каталог: показує звичайний вибір локації', () => {
    useNearestLocationsMock.mockReturnValue({
      ...baseHook,
      data: {
        city: 'Київ',
        sortedByDistance: false,
        locations: [
          {
            id: 'loc-1',
            code: 'BAUMANA',
            name: 'Fade на Баумана',
            address: 'вул. Баумана, 1',
            distanceKm: null,
          },
        ],
      },
    });
    render(<LocationStep onSelect={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Оберіть локацію' })).toBeInTheDocument();
    expect(screen.getByText('Fade на Баумана')).toBeInTheDocument();
    expect(screen.queryByText(BOOKING_OPENS_SOON_TEXT)).toBeNull();
  });
});