import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import LocationsPage from '../page';
import LocationDetailPage from '../[code]/page';
import { getLocations, getLocationByCode } from '@/lib/api/locations';

// T-4848a: на `/locations` і `/locations/{code}` контрол названий видимим текстом —
// `aria-label` не повторює заголовок, ім'я посилання на карту не залежить від стрілки,
// порядок табу слідує візуальному порядку.

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    mockCreateElement('a', { href, ...rest }, children),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('@/lib/api/locations', () => ({ getLocations: jest.fn(), getLocationByCode: jest.fn() }));

// `@fade/ui` не резолвиться в jest-оточенні (baseline): підмінюємо лише те, що в дереві.
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
      Button: box('button'),
      TextField: ({ label, ...rest }: Record<string, unknown>) =>
        React.createElement('label', null, label as string, React.createElement('input', rest)),
      cn: (...values: unknown[]) => values.filter(Boolean).join(' '),
    };
  },
  { virtual: true }
);

const getLocationsMock = getLocations as jest.MockedFunction<typeof getLocations>;
const getLocationByCodeMock = getLocationByCode as jest.MockedFunction<typeof getLocationByCode>;

// prettier-ignore
const studio = (over: Record<string, unknown> = {}) => ({
  id: 'loc-1', code: 'BAUMANA', name: 'Fade на Баумана', address: 'вул. Баумана, 1',
  lat: 50.44, lng: 30.49, phone: null, email: null, active: true, hours: [], chairs: [],
  channels: [], photos: [], logo: null, ...over,
});

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])';

/**
 * Доступна назва контрола: `aria-label`, інакше видимий текст; для поля вводу —
 * текст його `label`. Картка студії (T-4823) — посилання-накладка без тексту,
 * тож її назва приходить саме з `aria-label`.
 */
const name = (element: HTMLElement) => {
  const label0 = (element.getAttribute('aria-label') ?? '').replace(/\s+/g, ' ').trim();
  if (label0) return label0;
  const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  const label = (element as HTMLInputElement).labels?.[0];
  return text || (label?.textContent ?? '').replace(/\s+/g, ' ').trim();
};

/** `aria-label`, що дослівно повторює видимий текст того ж елемента. */
const repeatedLabels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[aria-label]'))
    .filter((element) => {
      const visible = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      const label = (element.getAttribute('aria-label') ?? '').trim();
      return visible.length > 0 && visible.includes(label);
    })
    .map((element) => element.getAttribute('aria-label'));

describe('Location names and focus — website', () => {
  it('список: ланцюжок, пошук, картки — у цьому порядку, без повторених підписів', async () => {
    getLocationsMock.mockResolvedValue({
      state: 'ok',
      data: [studio(), studio({ id: 'loc-2', code: 'KYIV', name: 'Fade на Хрещатику' })],
    });
    const { container } = render(await LocationsPage());
    const order = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).map(name);

    expect(order.slice(0, 2)).toEqual(['Головна', 'Знайти студію']);
    expect(order.indexOf('Fade на Баумана')).toBeGreaterThan(1);
    expect(repeatedLabels(container)).toEqual([]);
  });

  it('студія: ланцюжок, дії, регіони — у цьому порядку; карта названа словами', async () => {
    getLocationByCodeMock.mockResolvedValue({ state: 'ok', data: studio() });
    const { container } = render(
      await LocationDetailPage({ params: Promise.resolve({ code: 'BAUMANA' }) })
    );
    const order = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).map(name);
    const position = (text: string) => order.findIndex((item) => item.startsWith(text));

    expect(position('Головна')).toBe(0);
    expect(position('Записатися')).toBeGreaterThan(position('Головна'));
    expect(position('Показати на карті')).toBeGreaterThan(position('Записатися'));
    expect(position('Поділитися')).toBeGreaterThan(position('Показати на карті'));
    expect(screen.getByRole('link', { name: 'Показати на карті' })).toBeTruthy();
    expect(order.every((item) => /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(item))).toBe(true);
    expect(repeatedLabels(container)).toEqual([]);
  });
});
