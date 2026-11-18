import { createElement as mockCreateElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import LocationsPage from '../page';
import LocationDetailPage from '../[code]/page';
import { getLocationByCode, getLocations } from '@/lib/api/locations';

// T-4842: список і сторінка студії користуються одним ланцюжком.
// Список: Головна → Локації (поточна — текст). Студія додає назву.

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

jest.mock('@/lib/api/locations', () => ({
  getLocations: jest.fn(),
  getLocationByCode: jest.fn(),
}));

const getLocationsMock = getLocations as jest.MockedFunction<typeof getLocations>;
const getLocationByCodeMock = getLocationByCode as jest.MockedFunction<typeof getLocationByCode>;

const active = {
  id: 'loc-1',
  code: 'LVI-01',
  name: 'Fade на Липській',
  address: 'вул. Липська, 1',
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
};

describe('Breadcrumb локацій (T-4842)', () => {
  it('listing ends on «Локації» as the current page', async () => {
    getLocationsMock.mockResolvedValue({ state: 'ok', data: [active] });
    render(await LocationsPage());

    const nav = screen.getByRole('navigation', { name: 'Навігаційний ланцюжок' });
    expect(within(nav).getByRole('link', { name: 'Головна' }).getAttribute('href')).toBe('/');
    expect(within(nav).getByText('Локації').getAttribute('aria-current')).toBe('page');
    expect(within(nav).queryByRole('link', { name: 'Локації' })).toBeNull();
    expect(screen.queryByText(/На головну/)).toBeNull();
  });

  it('studio page adds the studio name as the current item', async () => {
    getLocationByCodeMock.mockResolvedValue({ state: 'ok', data: active });
    render(await LocationDetailPage({ params: Promise.resolve({ code: 'LVI-01' }) }));

    const nav = screen.getByRole('navigation', { name: 'Навігаційний ланцюжок' });
    expect(within(nav).getByRole('link', { name: 'Локації' }).getAttribute('href')).toBe(
      '/locations'
    );
    expect(within(nav).getByText('Fade на Липській').getAttribute('aria-current')).toBe('page');
    expect(screen.queryByText(/Усі локації/)).toBeNull();
  });
});
