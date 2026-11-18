/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '../route';

describe('PATCH /api/account/name', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 401 if unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/name', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'John Doe' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if name is missing or empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/name', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc' },
      body: JSON.stringify({ name: '   ' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Name is required');
  });

  it('successfully updates name when valid', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, name: 'John Doe' }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/account/name', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '  John Doe  ' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/profile/name'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'John Doe' }),
      })
    );
  });
});
