import { render, screen } from '@testing-library/react';
import HomePage from '../page';
import { getLocations } from '@/lib/api/locations';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={String(props.alt ?? '')} src={String(props.src ?? '')} />
  ),
}));

jest.mock('@/lib/api/locations', () => ({ getLocations: jest.fn() }));
jest.mock('@/app/components/BlogTeaser', () => ({ BlogTeaser: () => null }));

const getLocationsMock = getLocations as jest.MockedFunction<typeof getLocations>;

const location = {
  id: 'loc-1',
  code: 'BAUMANA',
  name: 'Fade на Баумана',
  address: 'вул. Баумана, 1',
  lat: 50.44,
  lng: 30.49,
  phone: '+380501234567',
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
};

describe('головна залежно від каталогу (T-4614e)', () => {
  it('порожній каталог: жодного CTA запису й жодної ціни', async () => {
    getLocationsMock.mockResolvedValue({ state: 'empty' });
    const { container } = render(await HomePage());

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/скоро відкриється/i);
    expect(screen.queryByRole('link', { name: /Записатися/ })).toBeNull();
    expect(container.querySelectorAll('a[href^="/booking"]')).toHaveLength(0);
    expect(container.textContent).not.toContain('₴');
  });

  it('активний каталог: звичайна головна з CTA запису й цінами', async () => {
    getLocationsMock.mockResolvedValue({ state: 'ok', data: [location] });
    const { container } = render(await HomePage());

    expect(screen.getByText(/Точність форми/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /Записатися онлайн/i })[0]?.getAttribute('href')
    ).toBe('/booking');
    expect(container.textContent).toContain('600 ₴');
  });
});