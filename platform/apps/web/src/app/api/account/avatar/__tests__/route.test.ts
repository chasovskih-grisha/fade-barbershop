/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '../route';

describe('PATCH /api/account/avatar', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: 'https://example.com/avatar.jpg' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 if JSON body is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/avatar', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token' },
      body: 'invalid-json',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: 'Invalid JSON body' });
  });

  it('returns 400 if avatarUrl is missing or invalid URL', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/avatar', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({ avatarUrl: 'not-a-url' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('successfully updates avatar when valid', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, avatarUrl: 'https://example.com/avatar.jpg' }),
    });

    const req = new NextRequest('http://localhost:3000/api/account/avatar', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token', Cookie: 'session=123' },
      body: JSON.stringify({ avatarUrl: 'https://example.com/avatar.jpg' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true, avatarUrl: 'https://example.com/avatar.jpg' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/profile/avatar'),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          Cookie: 'session=123',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ avatarUrl: 'https://example.com/avatar.jpg' }),
      })
    );
  });
});
