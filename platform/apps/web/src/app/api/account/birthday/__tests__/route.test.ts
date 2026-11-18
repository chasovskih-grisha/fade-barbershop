/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '../route';

describe('PATCH /api/account/birthday (T-4730b)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 401 if unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/birthday', {
      method: 'PATCH',
      body: JSON.stringify({ birthday: { day: 12, month: 11 } }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 400 for an impossible day', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/birthday', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc' },
      body: JSON.stringify({ birthday: { day: 31, month: 2 } }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Impossible day and month');
  });

  it('forwards a saved day and month', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ birthday: { day: 12, month: 11 } }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/account/birthday', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthday: { day: 12, month: 11 } }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect((await res.json()).birthday).toEqual({ day: 12, month: 11 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/profile/birthday'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('forwards a clear (null) without calling any campaign API', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ birthday: null }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/account/birthday', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthday: null }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
