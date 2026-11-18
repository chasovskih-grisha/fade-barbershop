/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('POST /api/auth/logout', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('successfully calls upstream logout and forwards set-cookie', async () => {
    const mockHeaders = new Headers();
    mockHeaders.append('set-cookie', 'fadoidx=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: mockHeaders,
    } as unknown as Response);

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'fadoidx=abc' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(res.headers.get('set-cookie')).toContain('fadoidx=');
  });
});
