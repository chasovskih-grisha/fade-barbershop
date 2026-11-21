/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('GET /api/account/bookings', () => {
  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/bookings');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(res.headers.get('X-Correlation-ID')).toBeDefined();
  });

  it('returns 400 when query parameters are invalid', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/account/bookings?status=invalid_status',
      {
        headers: { Authorization: 'Bearer token-123' },
      }
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('fetches appointments successfully when authenticated and params are valid', async () => {
    const mockAppointments = [{ id: 'apt-1', status: 'upcoming', service: 'Fade & Beard Trim' }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAppointments,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/account/bookings?status=upcoming&limit=10',
      {
        headers: { Cookie: 'session=abc' },
      }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockAppointments);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/appointments?status=upcoming&limit=10&offset=0'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Cookie: 'session=abc',
          'X-Correlation-ID': expect.any(String),
        }),
      })
    );
  });

  it('handles upstream errors gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ message: 'Upstream service timeout' }),
    });

    const req = new NextRequest('http://localhost:3000/api/account/bookings', {
      headers: { Authorization: 'Bearer token-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Upstream service timeout');
  });
});
