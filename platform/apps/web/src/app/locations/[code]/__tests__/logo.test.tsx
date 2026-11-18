import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import LocationDetailPage from '../page';
import { getLocationByCode } from '@/lib/api/locations';

// Знак локації на детальній сторінці (T-4609): hero показує логотип із моделі,
// а без нього — нічний мережевий знак; JSON-LD віддає `logo`/`image`.

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
  // Тестовий стенд: createElement обходить JSX-правило без директив.
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

jest.mock('@/lib/api/locations', () => ({ getLocationByCode: jest.fn() }));

const getLocationByCodeMock = getLocationByCode as jest.MockedFunction<typeof getLocationByCode>;

const base = {
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
  chairs: [{ number: 1, name: null, active: true }],
  channels: [],
  photos: [],
  logo: null,
};

const withLogo = {
  ...base,
  logo: {
    variant: 'lockup' as const,
    lightUrl: 'https://media.test/light.svg',
    darkUrl: 'https://media.test/dark.svg',
    alt: 'FADE Bauman',
  },
};

const renderDetail = async (data: unknown) => {
  (getLocationByCodeMock.mockResolvedValue as (m: unknown) => unknown)({ state: 'ok', data });
  return render(await LocationDetailPage({ params: Promise.resolve({ code: 'BAUMANA' }) }));
};

describe('LocationDetailPage — логотип (T-4609)', () => {
  it('без логотипа hero показує нічний знак-фолбек', async () => {
    await renderDetail(base);
    expect(screen.getByAltText('Логотип Fade на Баумана')).toBeTruthy();
  });

  it('з логотипом hero бере alt з моделі', async () => {
    await renderDetail(withLogo);
    expect(screen.getByAltText('FADE Bauman').getAttribute('src')).toBe(
      'https://media.test/light.svg'
    );
  });

  it('JSON-LD віддає logo та image зі світлого URL', async () => {
    const { container } = await renderDetail(withLogo);
    const json = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent!
    );
    expect(json.logo).toBe('https://media.test/light.svg');
    expect(json.image).toBe('https://media.test/light.svg');
  });
});
