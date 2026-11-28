import { createElement as mockCreateElement } from 'react';
import { render } from '@testing-library/react';
import LocationDetailPage from '../page';
import { getLocationByCode } from '@/lib/api/locations';

// T-4821a: на сторінці студії місто на екрані й у JSON-LD — це
// `addressParts.city`; без міста ключ `addressLocality` відсутній.

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

jest.mock(
  '@fade/ui',
  () => {
    const React = jest.requireActual<typeof import('react')>('react');
    const box = (tag: string) =>
      function Box(props: Record<string, unknown>) {
        return React.createElement(tag, props, props.children as React.ReactNode);
      };
    return {
      Card: box('div'),
      EmptyState: box('div'),
      AlertBanner: ({ tone, title, description, children }: Record<string, unknown>) =>
        React.createElement(
          'div',
          tone === 'error' ? { role: 'alert' } : null,
          React.createElement('p', null, title as string),
          React.createElement('p', null, description as string),
          children as React.ReactNode
        ),
      Button: box('button'),
      Skeleton: box('div'),
      cn: (...values: unknown[]) => values.filter(Boolean).join(' '),
    };
  },
  { virtual: true }
);

jest.mock('@/lib/api/locations', () => ({
  getLocationByCode: jest.fn(),
}));

const getLocationByCodeMock = getLocationByCode as jest.MockedFunction<typeof getLocationByCode>;

const lviv = {
  id: 'loc-1',
  code: 'LVI-01',
  name: 'Fade на Липській',
  address: 'вул. Липська, 1',
  addressParts: { street: 'Липська', building: '1', city: 'Львів' },
  lat: 49.84,
  lng: 24.03,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
};

type Fixture = Omit<typeof lviv, 'addressParts'> & {
  addressParts: typeof lviv.addressParts | null;
};

const renderPage = async (data: Fixture) => {
  getLocationByCodeMock.mockResolvedValue({ state: 'ok', data });
  return render(await LocationDetailPage({ params: Promise.resolve({ code: data.code }) }));
};

const jsonLd = (container: HTMLElement) =>
  JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}');

describe('LocationDetailPage — місто (T-4821a)', () => {
  it('показує місто з addressParts і віддає його в JSON-LD', async () => {
    const { container } = await renderPage(lviv);

    expect(container.textContent).toContain('вул. Липська, 1, Львів');
    expect(jsonLd(container).address.addressLocality).toBe('Львів');
    expect(container.textContent).not.toContain('Київ');
  });

  it('без міста не вигадує Київ і не віддає addressLocality', async () => {
    const { container } = await renderPage({ ...lviv, addressParts: null });

    expect(jsonLd(container).address).not.toHaveProperty('addressLocality');
    expect(container.textContent).not.toContain('Київ');
  });
});
