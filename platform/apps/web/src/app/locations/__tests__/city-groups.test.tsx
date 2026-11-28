import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { LocationCityGroups, groupByCity } from '../LocationCityGroups';
import type { Location } from '@/lib/api/locations';

// T-4821a: місто береться з `addressParts.city`. Групи — у порядку відповіді
// API, локації без міста — хвіст без вигаданого заголовка.

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

// Локальний стенд: `@fade/ui` не резолвиться в jest-оточенні (baseline),
// тож картка/стани підмінюються простими елементами з тими самими пропсами.
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
      EmptyState: ({ title, description, action }: Record<string, unknown>) =>
        React.createElement(
          'div',
          null,
          React.createElement('p', null, title as string),
          React.createElement('p', null, description as string),
          action as React.ReactNode
        ),
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

const studio = (over: Partial<Location>): Location => ({
  id: 'loc-1',
  code: 'CODE',
  name: 'Fade',
  address: 'вул. Тестова, 1',
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
  ...over,
});

const KYIV = { street: 'Хрещатик', building: '1', city: 'Київ' };
const LVIV = { street: 'Липська', building: '1', city: 'Львів' };

const locations = [
  studio({ id: 'k1', name: 'Fade Хрещатик', addressParts: KYIV }),
  studio({ id: 'l1', name: 'Fade Липська', addressParts: LVIV }),
  studio({ id: 'n1', name: 'Fade без міста', addressParts: null }),
  studio({ id: 'k2', name: 'Fade Поділ', addressParts: KYIV }),
];

describe('LocationCityGroups (T-4821a)', () => {
  it('groups by city in payload order and keeps the unknown city last', () => {
    const groups = groupByCity(locations);

    expect(groups.map((group) => group.city)).toEqual(['Київ', 'Львів', null]);
    expect(groups[0]?.locations.map((item) => item.id)).toEqual(['k1', 'k2']);
    expect(groups[2]?.locations.map((item) => item.id)).toEqual(['n1']);
  });

  it('renders one city heading per city and none for the unknown group', () => {
    render(<LocationCityGroups locations={locations} />);

    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
      .filter((text) => text === 'Київ' || text === 'Львів');

    expect(headings).toEqual(['Київ', 'Львів']);
    expect(screen.getByText('Fade без міста')).toBeTruthy();
  });

  it('shows a single city once, above its cards', () => {
    render(<LocationCityGroups locations={[studio({ id: 'l1', addressParts: LVIV })]} />);

    expect(screen.getAllByRole('heading', { name: 'Львів' })).toHaveLength(1);
  });
});
