import { fetchBarbers, fetchBarberById } from './barbers';

global.fetch = jest.fn();

describe('barbers api client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses barbers, filters out virtual any entry, and handles photos correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'b1', name: 'Alex', any: false, photo: { url: 'https://example.com/alex.jpg', alt: 'Alex', width: 100, height: 100 }, locationName: 'Central' },
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
      json: async () => [
        { id: 'b1', name: 'Alex', any: false },
      ],
    });

    const found = await fetchBarberById('loc-1', 'b1');
    expect(found?.name).toBe('Alex');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'b1', name: 'Alex', any: false },
      ],
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
});
