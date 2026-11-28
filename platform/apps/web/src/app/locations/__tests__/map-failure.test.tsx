import { createElement as mockCreateElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LocationsExplorer } from '../LocationsExplorer';
import { location } from '../__fixtures__/location-fixture';

// T-4826: якщо Leaflet не завантажився, людина бачить те саме речення й повний
// список студій — карта не забирає з екрана жодної картки.

jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    mockCreateElement('a', { href: props.href }, props.children as React.ReactNode),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

jest.mock('@fade/ui', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const box = (tag: string) => {
    const Box = (props: Record<string, unknown>) =>
      React.createElement(tag, props, props.children as React.ReactNode);
    Box.displayName = `Mock${tag}`;
    return Box;
  };
  return {
    Card: box('div'),
    Button: box('button'),
    TextField: ({ label, ...rest }: Record<string, unknown>) =>
      React.createElement('label', null, label as string, React.createElement('input', rest)),
    cn: (...values: unknown[]) => values.filter(Boolean).join(' '),
  };
});

jest.mock('leaflet', () => {
  throw new Error('leaflet unavailable');
});

const at = (code: string, name: string) => location(code, name, [50.45, 30.52]);

describe('Карта не завантажилась (T-4826)', () => {
  it('каже про це й лишає всі картки списку', async () => {
    render(
      <LocationsExplorer
        locations={[at('clt-01', 'FADE Central'), at('podil', 'FADE Podil')]}
      />
    );

    await waitFor(() => expect(screen.getByTestId('locations-map-fallback')).toBeTruthy());
    expect(screen.getByTestId('locations-map-fallback').textContent).toContain(
      'усі студії є в списку'
    );
    expect(screen.getByText('FADE Central')).toBeTruthy();
    expect(screen.getByText('FADE Podil')).toBeTruthy();
  });
});
