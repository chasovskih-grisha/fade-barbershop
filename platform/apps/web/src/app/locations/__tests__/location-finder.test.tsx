import { createElement as mockCreateElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocationFinder } from '../LocationFinder';
import type { Location } from '@/lib/api/locations';

// T-4828a: пошук по назві або адресі на `/locations`. Тест звіряє три стани
// поля: порожнє (усі студії), збіг (лише потрібні) і без збігу (речення +
// кнопка очищення). Поле — перед картками, тож до нього доходить клавіатура.

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

// `@fade/ui` не резолвиться в jest-оточенні (baseline): підмінюємо лише те,
// що реально рендериться в цьому дереві.
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
      Button: ({ children, ...rest }: Record<string, unknown>) =>
        React.createElement('button', rest, children as React.ReactNode),
      TextField: ({ label, ...rest }: Record<string, unknown>) =>
        React.createElement('label', null, label as string, React.createElement('input', rest)),
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

const locations = [
  studio({ id: 'b1', name: 'Fade на Баумана', address: 'вул. Баумана, 1' }),
  studio({ id: 'k1', name: 'Fade Хрещатик', address: 'вул. Хрещатик, 22' }),
];
const findField = () => screen.getByLabelText('Знайти студію') as HTMLInputElement;

describe('LocationFinder (T-4828a)', () => {
  it('shows every studio and the total count before typing', () => {
    render(<LocationFinder locations={locations} />);
    expect(screen.getByText('Fade на Баумана')).toBeTruthy();
    expect(screen.getByText('Fade Хрещатик')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('2');
  });

  it('filters by a street, ignoring case and surrounding spaces', () => {
    render(<LocationFinder locations={locations} />);
    fireEvent.change(findField(), { target: { value: '  хрещатик ' } });
    expect(screen.queryByText('Fade на Баумана')).toBeNull();
    expect(screen.getByText('Fade Хрещатик')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('1');
  });

  it('offers a sentence and a clear button when nothing matches', () => {
    render(<LocationFinder locations={locations} />);
    fireEvent.change(findField(), { target: { value: 'Одеса' } });
    expect(screen.getByText(/«Одеса»/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Показати всі студії' }));
    expect(screen.getByText('Fade на Баумана')).toBeTruthy();
    expect(findField().value).toBe('');
  });

  it('places the field before the cards so the keyboard reaches it first', () => {
    render(<LocationFinder locations={locations} />);
    const field = findField();
    expect(field.getAttribute('type')).toBe('search');
    expect(
      field.compareDocumentPosition(screen.getByText('Fade на Баумана')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
