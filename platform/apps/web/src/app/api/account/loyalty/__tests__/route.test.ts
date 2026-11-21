/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('GET /api/account/loyalty', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/loyalty');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 if query parameters are invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/loyalty?limit=invalid', {
      headers: { Authorization: 'Bearer token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('successfully retrieves loyalty membership info when valid', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tier: 'VIP',
        points: 1250,
        perks: ['Free Beard Trim', 'Priority Booking'],
      }),
    });

    const req = new NextRequest(
      'http://localhost:3000/api/account/loyalty?includeHistory=true&limit=5',
      {
        headers: { Authorization: 'Bearer token', Cookie: 'session=123' },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      tier: 'VIP',
      points: 1250,
      perks: ['Free Beard Trim', 'Priority Booking'],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/loyalty?includeHistory=true&limit=5'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          Cookie: 'session=123',
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
