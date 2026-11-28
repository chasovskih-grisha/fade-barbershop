import { fetchBarbers, fetchBarberById, listedBarbers } from './barbers';

global.fetch = jest.fn();

describe('barbers api client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses barbers, filters out virtual any entry, and handles photos correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'b1',
          name: 'Alex',
          any: false,
          photo: { url: 'https://example.com/alex.jpg', alt: 'Alex', width: 100, height: 100 },
          locationName: 'Central',
        },
        { id: 'any', name: 'Any barber', any: true },
        { id: 'b2', name: 'Max', photo: null, locationName: 'Central' },
      ],
    });

    const barbers = await fetchBarbers('loc-1');
    expect(barbers).toHaveLength(2);
    expect(barbers[0]?.id).toBe('b1');
    expect(barbers[0]?.photo?.url).toBe('https://example.com/alex.jpg');
    expect(barbers[1]?.id).toBe('b2');
    expect(barbers[1]?.photo).toBeNull();
  });

  it('finds barber by id or returns null when not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'b1', name: 'Alex', any: false }],
    });

    const found = await fetchBarberById('loc-1', 'b1');
    expect(found?.name).toBe('Alex');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'b1', name: 'Alex', any: false }],
    });
    const missing = await fetchBarberById('loc-1', 'unknown');
    expect(missing).toBeNull();
  });

  it('throws error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await expect(fetchBarbers('loc-1')).rejects.toThrow('Failed to fetch barbers');
  });

  it('не пускає у список запис без id, без імені чи фото без адреси (T-4869)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'b1', name: 'Alex', photo: { url: '   ', alt: 'Alex', width: 10, height: 10 } },
        { name: 'Без id', photo: null },
        { id: 'b2' },
        'not-a-barber',
      ],
    });

    const barbers = await fetchBarbers('loc-1');
    expect(barbers).toEqual([
      { id: 'b1', name: 'Alex', photo: null },
    ]);
  });

  it('keeps an inactive barber in the payload but out of the list (T-4865b)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'b1', name: 'Alex' },
        { id: 'b2', name: 'Petro', active: false },
        { id: 'b3', name: 'Oleg', active: true },
      ],
    });

    const all = await fetchBarbers('loc-1');
    expect(all.map((barber) => barber.id)).toEqual(['b1', 'b2', 'b3']);
    // Відсутній прапорець — показувати: старший payload не ховає людей.
    expect(listedBarbers(all).map((barber) => barber.id)).toEqual(['b1', 'b3']);
  });
});
