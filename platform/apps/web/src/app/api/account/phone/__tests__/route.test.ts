/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '../route';

describe('PATCH /api/account/phone', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 401 if unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/phone', {
      method: 'PATCH',
      body: JSON.stringify({ phone: '+15552345678' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if JSON body is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/phone', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: 'invalid-json',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  it('returns 400 if phone is missing or invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/phone', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc' },
      body: JSON.stringify({ phone: 'invalid-phone' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid phone number format');
  });

  it('successfully updates phone when valid', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, phone: '+15552345678' }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/account/phone', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+1 (555) 234-5678' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/profile/phone'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ phone: '+15552345678' }),
      })
    );
  });
});
