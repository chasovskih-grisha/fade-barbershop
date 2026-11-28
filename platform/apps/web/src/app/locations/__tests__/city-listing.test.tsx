import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import LocationsPage, { metadata } from '../page';
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
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ refresh: jest.fn() }),
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
      TextField: ({ label, ...rest }: Record<string, unknown>) =>
        React.createElement('label', null, label as string, React.createElement('input', rest)),
      Skeleton: box('div'),
      cn: (...values: unknown[]) => values.filter(Boolean).join(' '),
    };
  },
  { virtual: true }
);

jest.mock('@/lib/api/locations', () => ({
  getLocations: jest.fn(),
}));

const getLocationsMock = getLocations as jest.MockedFunction<typeof getLocations>;

const base = {
  id: 'loc-1',
  code: 'CODE',
  name: 'Fade',
  address: 'вул. Тестова, 1',
  lat: 0,
  lng: 0,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
};

describe('LocationsPage — місто (T-4821a)', () => {
  it('опис сторінки не називає Київ', () => {
    expect(JSON.stringify(metadata)).not.toContain('Київ');
  });

  it('два міста рендеряться двома групами', async () => {
    getLocationsMock.mockResolvedValue({
      state: 'ok',
      data: [
        {
          ...base,
          id: 'lviv',
          code: 'LVI-01',
          name: 'Fade Львів',
          addressParts: { street: 'Липська', building: '1', city: 'Львів' },
        },
        {
          ...base,
          id: 'kyiv',
          code: 'KYIV-01',
          name: 'Fade Київ',
          addressParts: { street: 'Хрещатик', building: '1', city: 'Київ' },
        },
      ],
    });
    render(await LocationsPage());

    expect(screen.getByRole('heading', { name: 'Львів' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Київ' })).toBeTruthy();
  });
});
