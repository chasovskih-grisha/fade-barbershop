import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import LocationsPage from '../page';
import { getLocations } from '@/lib/api/locations';

// Сторінка списку локацій (T-4513): помилка, порожній каталог і дані —
// три різні екрани. Тест звіряє саме їх, бо «помилка → порожня таблиця»
// повертає гостя на сторінку без пояснення. Логотип локації — T-4609.

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
  // Тестовий стенд: createElement обходить JSX-правило без директив.
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('@/lib/api/locations', () => ({
  getLocations: jest.fn(),
}));

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

describe('LocationsPage — стани', () => {
  it('помилка API: сторінка жива, є AlertBanner і «Спробувати ще раз»', async () => {
    getLocationsMock.mockResolvedValue({
      state: 'error',
      message: 'Сервіс недоступний. Спробуйте за кілька хвилин.',
    });
    render(await LocationsPage());
    expect(screen.getByRole('heading', { name: 'Наші локації' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Сервіс недоступний');
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeTruthy();
  });

  it('порожній каталог: EmptyState пояснює, що запис відкриється з першою локацією, без CTA на /booking', async () => {
    getLocationsMock.mockResolvedValue({ state: 'empty' });
    render(await LocationsPage());
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(screen.getByText('Локацій ще немає')).toBeTruthy();
    expect(screen.getByText(/Запис відкриється разом із першою локацією/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Записатися' })).toBeNull();
  });

  it('дані: картка студії веде на деталі, «Записатися» — окремий контрол (T-4823)', async () => {
    getLocationsMock.mockResolvedValue({ state: 'ok', data: [location] });
    render(await LocationsPage());
    expect(screen.getByRole('heading', { name: 'Fade на Баумана' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Fade на Баумана' }).getAttribute('href')).toBe(
      '/locations/BAUMANA'
    );
    expect(screen.getByRole('link', { name: 'Записатися' }).getAttribute('href')).toBe('/booking');
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('картка локації без логотипа показує нічний знак з alt за назвою', async () => {
    getLocationsMock.mockResolvedValue({ state: 'ok', data: [location] });
    render(await LocationsPage());
    expect(screen.getByAltText('Логотип Fade на Баумана')).toBeTruthy();
  });

  it('картка локації з логотипом бере alt і URL з моделі', async () => {
    const withLogo = {
      ...location,
      logo: {
        variant: 'lockup' as const,
        lightUrl: 'https://media.test/light.svg',
        darkUrl: null,
        alt: 'FADE Bauman',
      },
    };
    getLocationsMock.mockResolvedValue({ state: 'ok', data: [withLogo] });
    render(await LocationsPage());
    expect(screen.getByAltText('FADE Bauman').getAttribute('src')).toBe(
      'https://media.test/light.svg'
    );
  });
});
