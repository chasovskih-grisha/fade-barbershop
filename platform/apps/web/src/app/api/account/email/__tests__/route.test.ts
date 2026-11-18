/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '../route';

describe('PATCH /api/account/email', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 401 if unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/email', {
      method: 'PATCH',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if JSON body is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/email', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: 'invalid-json',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  it('returns 400 if email is missing or invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/email', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid email address format');
  });

  it('successfully updates email when valid', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, email: 'user@example.com' }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/account/email', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '  USER@EXAMPLE.COM ' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/profile/email'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ email: 'user@example.com' }),
      })
    );
  });
});
