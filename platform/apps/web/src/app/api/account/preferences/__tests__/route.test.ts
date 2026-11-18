/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '../route';

describe('PATCH /api/account/preferences', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 401 if unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferences: ['coffee'] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if preferences is not an array', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/preferences', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc' },
      body: JSON.stringify({ preferences: 'not-an-array' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Expected array');
  });

  it('returns 400 if preferences contains non-string items', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/preferences', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc' },
      body: JSON.stringify({ preferences: [123] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Each preference must be a string');
  });

  it('returns 400 if preference item is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/preferences', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc' },
      body: JSON.stringify({ preferences: [''] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Preference cannot be empty');
  });

  it('successfully updates preferences when valid', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, preferences: [{ id: '1', text: 'coffee' }] }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/account/preferences', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: ['  coffee  '] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/profile/preferences'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ preferences: ['coffee'] }),
      })
    );
  });
});
