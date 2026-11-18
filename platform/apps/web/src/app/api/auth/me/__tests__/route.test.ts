/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('GET /api/auth/me', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns user: null if cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/me');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it('returns user profile when authenticated', async () => {
    const userProfile = { id: 'usr_1', email: 'test@barbershop.com', name: 'Test User' };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => userProfile,
    } as unknown as Response);

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { Cookie: 'fadoidx=abc' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toEqual(userProfile);
  });

  it('returns user: null on 401 unauthorized', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    } as unknown as Response);

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { Cookie: 'fadoidx=expired' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });
});
