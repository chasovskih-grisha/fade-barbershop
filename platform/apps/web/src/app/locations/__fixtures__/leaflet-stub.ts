// Мінімальний двійник Leaflet для jsdom: карта, шар тайлів і піни, які
// запам'ятовують свій обробник кліку. Спільний для обох тестів карти (T-4826).

export type StubPin = { latlng: [number, number]; click?: () => void };

export const mockPins: StubPin[] = [];

export const mockMap: {
  setView: jest.Mock;
  fitBounds: jest.Mock;
  getZoom: jest.Mock;
  remove: jest.Mock;
} = {
  setView: jest.fn(() => mockMap),
  fitBounds: jest.fn(() => mockMap),
  getZoom: jest.fn(() => 12),
  remove: jest.fn(),
};

export const mockTileLayer = jest.fn((..._args: unknown[]) => ({ addTo: () => ({}) }));

export const leafletStub = {
  map: () => mockMap,
  tileLayer: (...args: unknown[]) => mockTileLayer(...args),
  circleMarker: (latlng: [number, number]) => {
    const pin: StubPin = { latlng };
    const layer = {
      addTo: () => layer,
      on: (event: string, callback: () => void) => {
        if (event === 'click') pin.click = callback;
        return layer;
      },
      getLatLng: () => ({ lat: latlng[0], lng: latlng[1] }),
    };
    mockPins.push(pin);
    return layer;
  },
};

export function resetLeafletStub() {
  mockPins.length = 0;
  jest.clearAllMocks();
}
