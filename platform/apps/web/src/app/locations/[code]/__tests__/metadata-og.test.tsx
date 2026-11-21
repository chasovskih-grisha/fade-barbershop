import { render } from '@testing-library/react';
import LocationDetailPage, { generateMetadata } from '../page';
import { getLocationByCode } from '@/lib/api/locations';

// T-4841: прев'ю посилання на студію — перше фото за sortOrder, коли галерея
// не порожня; без фото `og:image` не вигадується. Логотип у Schema.org
// лишається знаком (T-4609b), а не фотографією.

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
  default: () => null,
}));

jest.mock('@/lib/api/locations', () => ({ getLocationByCode: jest.fn() }));

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
  photos: [
    { url: 'https://media.test/second.jpg', caption: 'Друге', sortOrder: 2 },
    { url: 'https://media.test/first.jpg', caption: 'Зал', sortOrder: 1 },
  ],
  logo: {
    variant: 'mark' as const,
    lightUrl: 'https://media.test/logo-light.svg',
    darkUrl: null,
    alt: 'Fade на Липській',
  },
};

const meta = (data: typeof active) => {
  getLocationByCodeMock.mockResolvedValue({ state: 'ok', data });
  return generateMetadata({ params: Promise.resolve({ code: data.code }) });
};

describe('LocationDetailPage — og:image (T-4841)', () => {
  it('uses the first photo by sortOrder as the link preview', async () => {
    const result = await meta(active);
    expect(result.openGraph?.images).toEqual([{ url: 'https://media.test/first.jpg' }]);
  });

  it('does not invent an image for a studio without photos', async () => {
    const result = await meta({ ...active, photos: [] });
    expect(result.openGraph?.images).toBeUndefined();
  });

  it('keeps the Schema.org logo as the mark', async () => {
    getLocationByCodeMock.mockResolvedValue({ state: 'ok', data: active });
    const { container } = render(
      await LocationDetailPage({ params: Promise.resolve({ code: 'LVI-01' }) })
    );
    const json = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent!
    );
    expect(json.logo).toBe('https://media.test/logo-light.svg');
  });
});
