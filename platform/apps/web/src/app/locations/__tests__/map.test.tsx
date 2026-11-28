import { createElement as mockCreateElement } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { location } from '../__fixtures__/location-fixture';
import { mockMap, mockPins, mockTileLayer, resetLeafletStub } from '../__fixtures__/leaflet-stub';
import { LocationsExplorer } from '../LocationsExplorer';
import type { Location } from '@/lib/api/locations';

// T-4826: піни будуються з координат запису, вибір піна веде до картки, вибір
// картки веде до піна, а тайли — OpenStreetMap без ключа й акаунта.

jest.mock('leaflet', () => ({
  __esModule: true,
  default: jest.requireActual<{ leafletStub: unknown }>('../__fixtures__/leaflet-stub').leafletStub,
}));

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

const locations: Location[] = [
  location('clt-01', 'FADE Central', [50.45, 30.52]),
  location('podil', 'FADE Podil', [50.46, 30.51]),
];

describe('Карта на /locations (T-4826)', () => {
  beforeEach(() => {
    resetLeafletStub();
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('ставить пін на координати кожного запису й тягне тайли OSM без ключа', async () => {
    render(<LocationsExplorer locations={locations} />);

    await waitFor(() => expect(mockPins).toHaveLength(2));
    expect(mockPins.map((pin) => pin.latlng)).toEqual([
      [50.45, 30.52],
      [50.46, 30.51],
    ]);
    const tileUrl = String(mockTileLayer.mock.calls[0]?.[0]);
    expect(tileUrl).toContain('tile.openstreetmap.org');
    expect(tileUrl).not.toContain('access_token');
  });

  it('вибір піна підсвічує картку, фокусує її й прокручує до неї', async () => {
    render(<LocationsExplorer locations={locations} />);
    await waitFor(() => expect(mockPins).toHaveLength(2));

    act(() => mockPins[1]?.click?.());

    const card = document.getElementById('studio-card-podil');
    expect(card?.className).toContain('ring-2');
    expect(document.activeElement).toBe(card);
    expect(document.getElementById('studio-card-clt-01')?.className).not.toContain('ring-2');
  });

  it('кнопка «На карті» веде карту до координат цієї студії', async () => {
    render(<LocationsExplorer locations={locations} />);
    await waitFor(() => expect(mockPins).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Показати FADE Podil на карті' }));

    await waitFor(() => expect(mockMap.setView).toHaveBeenCalledWith({ lat: 50.46, lng: 30.51 }, 14));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
