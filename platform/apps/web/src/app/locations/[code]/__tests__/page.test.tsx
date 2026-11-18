import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import LocationDetailPage, { generateMetadata } from '../page';
import { getLocationByCode } from '@/lib/api/locations';

// Детальна сторінка локації (T-4513): невідомий код → 404, помилка API → жива
// сторінка з retry, вимкнена → «не приймає записів» (не 404), активна → вміст.

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
  // Тестовий стенд, не продукт: createElement обходить JSX-правило без директив.
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

jest.mock('@/lib/api/locations', () => ({
  getLocationByCode: jest.fn(),
}));

const getLocationByCodeMock = getLocationByCode as jest.MockedFunction<typeof getLocationByCode>;

const active = {
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
  // prettier-ignore
  channels: [],
  photos: [],
  logo: null,
};

describe('LocationDetailPage — стани', () => {
  /** Сід моку + рендер деталки (DRY для чотирьох станів). */
  // prettier-ignore
  const renderWith = async (mock: unknown) => {
    (getLocationByCodeMock.mockResolvedValue as (m: unknown) => unknown)(mock);
    render(await LocationDetailPage({ params: Promise.resolve({ code: 'BAUMANA' }) }));
  };

  it('невідомий код → 404', async () => {
    getLocationByCodeMock.mockResolvedValue({ state: 'notFound' });
    // prettier-ignore
    await expect(LocationDetailPage({ params: Promise.resolve({ code: 'NOPE' }) })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('помилка API → сторінка лишається живою й пропонує повтор', async () => {
    // prettier-ignore
    await renderWith({ state: 'error', message: 'Сервіс недоступний. Спробуйте за кілька хвилин.' });
    expect(screen.getByRole('alert').textContent).toContain('Сервіс недоступний');
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeTruthy();
  });

  it('вимкнена локація → пояснення й CTA на інші локації, а не 404', async () => {
    await renderWith({ state: 'ok', data: { ...active, active: false } });
    expect(screen.getByText('Ця локація тимчасово не приймає записів')).toBeTruthy();
    // prettier-ignore
    expect(screen.getByRole('link', { name: 'Обрати іншу локацію' }).getAttribute('href')).toBe('/locations');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('активна локація → вміст і CTA запис, без банерів', async () => {
    await renderWith({ state: 'ok', data: active });
    expect(screen.getByRole('heading', { level: 1, name: 'Fade на Баумана' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Записатися' })).toBeTruthy();
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('рендерить JSON-LD структуру HairSalon для активної локації', async () => {
    (getLocationByCodeMock.mockResolvedValue as (m: unknown) => unknown)({
      state: 'ok',
      data: active,
    });
    const { container } = render(
      await LocationDetailPage({ params: Promise.resolve({ code: 'BAUMANA' }) })
    );
    const scriptTag = container.querySelector('script[type="application/ld+json"]');
    expect(scriptTag).toBeTruthy();
    const json = JSON.parse(scriptTag!.textContent!);
    expect(json['@type']).toBe('HairSalon');
    expect(json.name).toContain('Fade на Баумана');
    expect(json.address.streetAddress).toBe('вул. Баумана, 1');
  });
  it('SEO: неактивна — поза індексом, активна — у індексі', async () => {
    getLocationByCodeMock.mockResolvedValue({ state: 'ok', data: { ...active, active: false } });
    const inactiveMeta = await generateMetadata({ params: Promise.resolve({ code: 'BAUMANA' }) });
    expect(inactiveMeta.robots).toEqual({ index: false, follow: false });

    getLocationByCodeMock.mockResolvedValue({ state: 'ok', data: active });
    const activeMeta = await generateMetadata({ params: Promise.resolve({ code: 'BAUMANA' }) });
    expect(activeMeta.title).toContain('Fade на Баумана');
    expect(activeMeta.robots).toBeUndefined();
  });
});
