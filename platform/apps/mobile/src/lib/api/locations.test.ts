import { fetchLocation, fetchLocations } from './locations';

global.fetch = jest.fn();

// T-4850: мобільний клієнт читає той самий публічний payload, що сайт;
// `addressParts` лишається `addressParts`, а відсутня локація — null, не
// порожня студія.

const payload = (overrides: Record<string, unknown> = {}) => ({
  id: 'loc-1',
  code: 'LVI-01',
  name: 'Fade на Липській',
  address: 'вул. Липська, 1',
  addressParts: null,
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
  ...overrides,
});

describe('locations api client (T-4850)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the public fields of the list payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [payload({ chairs: [{ number: 1, name: 'Біля вікна', active: true }] })],
    });

    const [location] = await fetchLocations();
    expect(location?.chairs).toEqual([{ number: 1, name: 'Біля вікна', active: true }]);
    expect(location?.addressParts).toBeNull();
  });

  it('reads a studio whose addressParts carries a city', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () =>
        payload({
          addressParts: { street: 'Липська', building: '1', city: 'Київ' },
        }),
    });

    const location = await fetchLocation('LVI-01');
    expect(location?.addressParts?.city).toBe('Київ');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/locations/LVI-01'));
  });

  it('reads a studio whose addressParts is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload(),
    });

    const location = await fetchLocation('LVI-01');
    expect(location?.addressParts).toBeNull();
    expect(location?.code).toBe('LVI-01');
  });

  it('returns null for an unknown code and throws on a failed response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(fetchLocation('NOPE')).resolves.toBeNull();

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchLocation('LVI-01')).rejects.toThrow('Failed to fetch location');
  });
});
